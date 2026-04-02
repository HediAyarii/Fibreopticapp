import { Pool, PoolClient } from 'pg'

// Configuration de la base de données optimisée pour le développement
const isDevelopment = process.env.NODE_ENV === 'development'

const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false, // Désactiver SSL pour le développement local
  // Configuration optimisée pour éviter les fuites de connexions en développement
  max: isDevelopment ? 20 : 50, // Augmenté pour meilleures performances
  min: isDevelopment ? 2 : 5, // Minimum de connexions toujours disponibles
  idleTimeoutMillis: isDevelopment ? 10000 : 30000, // Garder les connexions plus longtemps
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
  // Optimisations de performance
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Options de statement pour meilleures performances
  statement_timeout: 30000, // 30 secondes timeout pour les requêtes
  query_timeout: 30000,
}

// Pattern Singleton Global pour éviter les fuites lors du hot reload
declare global {
  var __postgresPool: Pool | undefined
  var __postgresPoolInitialized: boolean | undefined
}

// Pool de connexions PostgreSQL avec gestion globale
let pool: Pool | null = null

export function getPool(): Pool {
  // Utiliser le pattern singleton global pour éviter les fuites lors du hot reload
  if (global.__postgresPool && !global.__postgresPool.ended) {
    pool = global.__postgresPool
    return pool
  }

  if (!pool || pool.ended) {
    console.log('🔄 Création d\'un nouveau pool PostgreSQL...')
    pool = new Pool(dbConfig)
    
    // Stocker dans la variable globale pour éviter les fuites
    global.__postgresPool = pool
    
    // Gestion des erreurs de connexion
    pool.on('error', (err) => {
      console.error('❌ Erreur inattendue sur le client PostgreSQL:', err)
    })

    // Forcer le format de date européen (DD/MM/YYYY) sur toutes les connexions
    pool.on('connect', (client) => {
      client.query("SET datestyle = 'ISO, DMY'")
    })
    
    // Test de connexion au démarrage
    pool.connect()
      .then((client) => {
        console.log('✅ Connexion PostgreSQL établie avec succès')
        client.release()
      })
      .catch((err) => {
        console.error('❌ Erreur de connexion PostgreSQL:', err)
      })
  }
  
  return pool
}

// Fonction utilitaire pour exécuter des requêtes
export async function query(text: string, params?: any[]): Promise<any> {
  const pool = getPool()
  const start = Date.now()
  
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log(`📊 Query executed in ${duration}ms: ${text.substring(0, 50)}...`)
    return result
  } catch (error) {
    console.error('❌ Database query error:', error)
    throw error
  }
}

// Fonction utilitaire pour exécuter des requêtes avec gestion explicite des connexions
export async function queryWithClient(text: string, params?: any[]): Promise<any> {
  const pool = getPool()
  const start = Date.now()
  let client: PoolClient | null = null
  
  try {
    client = await pool.connect()
    const result = await client.query(text, params)
    const duration = Date.now() - start
    console.log(`📊 Query executed in ${duration}ms: ${text.substring(0, 50)}...`)
    return result
  } catch (error) {
    console.error('❌ Database query error:', error)
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Fonction pour obtenir un client de connexion
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return await pool.connect()
}

// Fonction pour surveiller l'état du pool
export function getPoolStats(): any {
  if (!pool) return null
  
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  }
}

// Variable pour éviter les fermetures multiples
let isClosing = false

// Fonction pour fermer le pool (utile pour les tests)
export async function closePool(): Promise<void> {
  // Éviter les fermetures multiples
  if (isClosing) {
    return
  }
  
  if (pool && !pool.ended) {
    isClosing = true
    try {
      await pool.end()
      pool = null
      global.__postgresPool = undefined
      console.log('🔌 Pool de connexions PostgreSQL fermé')
    } catch (error) {
      console.error('⚠️  Erreur lors de la fermeture du pool:', error)
    } finally {
      isClosing = false
    }
  }
}

// Fonction pour nettoyer les connexions orphelines
export async function cleanupOrphanedConnections(): Promise<void> {
  try {
    const pool = getPool()
    const result = await pool.query(`
      SELECT 
        pid,
        usename,
        application_name,
        state,
        query_start
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND state = 'idle'
        AND query_start < NOW() - INTERVAL '30 seconds'
      ORDER BY query_start
    `)
    
    if (result.rows.length > 0) {
      console.log(`🧹 Nettoyage de ${result.rows.length} connexions orphelines...`)
      
      for (const row of result.rows) {
        try {
          await pool.query('SELECT pg_terminate_backend($1)', [row.pid])
          console.log(`   ✅ Connexion ${row.pid} fermée`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
          console.log(`   ⚠️  Impossible de fermer la connexion ${row.pid}:`, errorMessage)
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des connexions:', error)
  }
}

// Fonction pour surveiller l'état des connexions
export async function monitorConnections(): Promise<any> {
  try {
    const pool = getPool()
    const result = await pool.query(`
      SELECT 
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction') as idle_in_transaction_connections
    `)
    
    const stats = result.rows[0]
    const maxConnections = parseInt(stats.max_connections)
    const currentConnections = parseInt(stats.current_connections)
    const activeConnections = parseInt(stats.active_connections)
    const idleConnections = parseInt(stats.idle_connections)
    const idleInTransactionConnections = parseInt(stats.idle_in_transaction_connections)
    const usagePercentage = ((currentConnections / maxConnections) * 100).toFixed(1)
    
    const poolStats = getPoolStats()
    
    return {
      maxConnections,
      currentConnections,
      activeConnections,
      idleConnections,
      idleInTransactionConnections,
      usagePercentage: `${usagePercentage}%`,
      poolStats,
      isHealthy: currentConnections < maxConnections * 0.8
    }
  } catch (error) {
    console.error('❌ Erreur lors du monitoring des connexions:', error)
    return null
  }
}

// Handlers de nettoyage automatique
let cleanupInProgress = false

function setupCleanupHandlers() {
  // Fonction de nettoyage commune
  const performCleanup = async (signal: string) => {
    if (cleanupInProgress) {
      return
    }
    cleanupInProgress = true
    console.log(`🔄 ${signal} - Nettoyage des connexions...`)
    await closePool()
  }

  // Nettoyage lors de l'arrêt du processus
  process.on('SIGINT', async () => {
    await performCleanup('SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await performCleanup('SIGTERM')
    process.exit(0)
  })

  // Nettoyage lors des erreurs non gérées (mais ne pas fermer le pool à chaque erreur)
  process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non gérée:', error)
    // Ne pas fermer le pool pour chaque erreur, seulement logger
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason)
    // Ne pas fermer le pool pour chaque promesse rejetée, seulement logger
  })

  // Nettoyage périodique des connexions orphelines (en développement)
  if (isDevelopment) {
    setInterval(async () => {
      try {
        await cleanupOrphanedConnections()
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage périodique:', error)
      }
    }, 30000) // Toutes les 30 secondes
  }
}

// Initialiser les handlers de nettoyage
setupCleanupHandlers()

// Types pour les tables principales
export interface Intervention {
  id?: number
  date_rdv?: string
  region?: string
  plaque?: string
  societe?: string
  nom_technicien?: string
  prenom_technicien?: string
  debut?: string
  duree?: string
  type_intervention?: string
  sav24?: string
  sav_rouge?: string
  client?: string
  num_inter?: string
  commande_id?: string
  statut?: string
  cloture_hotline?: string
  cloture_tech?: string
  debut_intervention?: string
  non_clos_pda?: string
  creneau_plus_2h?: string
  articles?: string
  garantie?: string
  motif_echec?: string
  echec_niveau_1?: string
  echec_niveau_2?: string
  panne_reseau?: string
  commentaires_technicien?: string
  commentaires_cloture?: string
  num_abonne?: string
  nom_abonne?: string
  numero?: string
  rue?: string
  mobile?: string
  domicile?: string
  bureau?: string
  voip?: string
  code_postal?: string
  ville?: string
  id_osiris?: string
  tap_fttla?: string
  noeud?: string
  numero_efacture?: string
  montant_efacture?: string
  sav_apres_sav?: string
  drapeau?: string
  type_logement?: string
  codes_secondaires?: string
  motif_delai_wig?: string
  dernier_rdv?: string
  occurences_abo_90_jours?: string
  gestionnaire_infra?: string
  idra?: string
  cause_sav?: string
  action_sav?: string
  longueur_cable?: string
  infos_racco_pavillon?: string
  type_pbo?: string
  nom_sro?: string
  be1?: string
  ref_pbo?: string
  type_operation?: string
  type_habitation?: string
  ref_ephem?: string
  activite?: string
  statut_wig?: string
  raison_sociale?: string
  type_offre_ref?: string
  type_offre_lib?: string
  type_pon?: string
  marque?: string
  marque_gp?: string
  grille?: string
  commentaire_modif_echec?: string
  id_immeuble?: string
  ndi_contrat?: string
  sct?: string
  affectation_bpi_vertical_1?: string
  affectation_bpi_horizontale?: string
  ref_prise?: string
  statut_box_4g?: string
  presta_precedent_succes?: string
  tech_precedent_succes?: string
  liste_prestations_realisees?: string
  prise_existante?: string
  nb_echange_materiel?: string
  commentaire_inter?: string
  inter_prioritaire?: string
  gem?: string
  transfo_cable?: string
  a_securiser?: string
  vip?: string
  decharge_check_voisinage?: string
  inter_cloturee_par?: string
  decharge_blocage_jy_suis?: string
  deblocage_blocage_jy_suis_par?: string
  check_voisinage?: string
  numero_ig_pr?: string
  note_gem?: string
  parcours_type?: string
  parcours_lib?: string
  reco_racc?: string
  date_racc?: string
  dernier_gem?: string
  motif_decharge?: string
  lignes_dechargees?: string
  commentaire_decharge?: string
  date_import?: string
  ref_maestro?: string
  ref_cmd?: string
  categorie_rdv?: string
  date_1er_rdv?: string
  presence_amiante?: string
  fil_nu?: string
  flag_bot?: string
  flag_appel_hors_presence_client?: string
  sav_regroupe?: string
  sav_rattachement?: string
  idur?: string
  adresse_pm?: string
  created_at?: Date
}

export interface CarburantConsommation {
  id?: number
  date_fact?: string
  date_livraison?: string
  heure_livraison?: string
  immat_vehicule?: string
  numero_carte?: string
  km?: string
  poste_1?: string
  poste_2?: string
  pays?: string
  numero_station?: string
  point_acceptation?: string
  identifiant_autoroute?: string
  cp?: string
  type_marchandises?: string
  quantite?: string
  taux_tva?: string
  ca_ht?: string
  tva?: string
  ca_ttc?: string
  numero_justificatif?: string
  created_at?: Date
}
