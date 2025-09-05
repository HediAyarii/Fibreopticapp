import { Pool, PoolClient } from 'pg'

// Configuration de la base de données
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false, // Désactiver SSL pour le développement local
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
}

// Pool de connexions PostgreSQL
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig)
    
    // Gestion des erreurs de connexion
    pool.on('error', (err) => {
      console.error('Erreur inattendue sur le client PostgreSQL:', err)
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

// Fonction pour obtenir un client de connexion
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return await pool.connect()
}

// Fonction pour fermer le pool (utile pour les tests)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('🔌 Pool de connexions PostgreSQL fermé')
  }
}

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
