const { Client } = require('pg')

async function setupFttoTarifs() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'finalfibre_db',
    user: 'finalfibre_user',
    password: 'finalfibre_password_2024'
  })
  await client.connect()

  try {
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ftto_tarifs (
        id SERIAL PRIMARY KEY,
        code_article VARCHAR(100) NOT NULL,
        designation TEXT NOT NULL,
        bpu DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table ftto_tarifs créée')

    // Check if already seeded
    const existing = await client.query('SELECT COUNT(*) FROM ftto_tarifs')
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`ℹ️  Table déjà peuplée (${existing.rows[0].count} enregistrements). Skip seed.`)
      return
    }

    // Seed initial FTTO tariffs
    const tarifs = [
      { code: 'FO-010', designation: 'Pose câble optique de 6 FO à 144 Fo sous fourreau', bpu: 0.73 },
      { code: 'FO-011', designation: 'Pose câble optique de 6 FO à 144 FO en intérieur', bpu: 1.46 },
      { code: 'FO-013', designation: 'Pose câble optique de 6 FO à 144 FO en aérien', bpu: 1.28 },
      { code: 'FO-130', designation: 'Câble optique de 6 FO', bpu: 16.61 },
      { code: 'FO-131', designation: 'Câble optique de 12 FO', bpu: 20.02 },
      { code: 'FO-132', designation: 'Câble optique de 24 FO', bpu: 22.02 },
      { code: 'FO-133', designation: 'Câble optique de 36 FO', bpu: 24.21 },
      { code: 'FO-134', designation: 'Câble optique de 48 FO', bpu: 26.71 },
      { code: 'FO-136', designation: 'Câble optique de 72 FO', bpu: 32.28 },
      { code: 'FO-138', designation: 'Câble optique de 96 FO', bpu: 39.11 },
      { code: 'FO-139', designation: 'Câble optique de 144 FO', bpu: 43.00 },
      { code: 'FO-141', designation: 'Câble optique de 288 FO', bpu: 84.01 },
      { code: 'FO-144', designation: 'Câble optique de 720 FO', bpu: 169.16 },
      { code: 'FO-240', designation: 'Câble optique de 6 FO à 144 FO (boîte)', bpu: 83.04 },
      { code: 'FO-241', designation: 'Câble optique de 145 FO à 576 FO', bpu: 166.08 },
      { code: 'FO-350', designation: "A l'unité", bpu: 5.34 },
      { code: 'FO-351', designation: 'Epissurage 12 FO', bpu: 35.93 },
      { code: 'FO-352', designation: 'Epissurage 24 FO', bpu: 71.86 },
      { code: 'FO-352B', designation: 'Epissurage 36 FO', bpu: 107.79 },
      { code: 'FO-354', designation: 'Epissurage 48 FO', bpu: 143.07 },
      { code: 'FO-356', designation: 'Epissurage 72 FO', bpu: 214.61 },
      { code: 'FO-358', designation: 'Epissurage 96 FO', bpu: 285.88 },
      { code: 'FO-359', designation: 'Epissurage 144 FO', bpu: 428.81 },
      { code: 'FO-361', designation: 'Epissurage 288 FO', bpu: 851.31 },
      { code: 'FO-400', designation: 'Pose de boite 6 FO à 144 FO', bpu: 23.36 },
      { code: 'FO-800', designation: 'Forfait intervention', bpu: 73.00 },
      { code: 'ALIGNEMENT', designation: 'FORFAIT ALIGNEMENT', bpu: 200.00 },
      { code: 'IM-101', designation: 'VISITE TECHNIQUE', bpu: 154.00 },
      { code: 'TRVX INT', designation: 'TRAVAUX INTRASITE', bpu: 400.00 },
      { code: 'TRVX EXT', designation: 'TRAVAUX EXTRASITE', bpu: 500.00 },
      { code: 'PV EXTRASITE', designation: 'PLUS VALUE EXTRA SITE', bpu: 0.90 },
      { code: 'IG-93', designation: "Plus-value applicable pour les sites complexes de type centres commerciaux : dépose faux-plafonds en HNO, nacelle, prestataire intra-site imposé", bpu: 600.00 },
      { code: 'IC-508', designation: "Forfait location 1 Jour Nacelle intérieure électrique pour travail en hauteur jusque 12m, compris transport A/R", bpu: 230.00 },
      { code: 'RACC-FTTE-BRE', designation: "BRE existante jusqu'à 500ml de tirage avec la pose d'une PTO (FOURNITURES ET POSES)", bpu: 565.00 },
      { code: 'COMPL ML FTTE', designation: "Complément au raccordement pour tirage au-delà de 500ml pour arriver en limite de propriété. Prix au ML tout compris", bpu: 0.64 },
      { code: 'DEPLOY PM-BRE', designation: "Création distribution PM-BRE (prix au ML déployé)", bpu: 1.40 },
      { code: 'TIROIR ENT PM', designation: "F&P Tiroir entreprise au PM", bpu: 40.00 },
      { code: 'TIROIR FTTE', designation: "F&P Tiroir optique Client dans le cadre de déploiement FTTE (Fixation - Nommage - Etiquetage - Photos)", bpu: 40.00 },
      { code: 'PANNE B2B', designation: 'PANNE B2B FORFAIT', bpu: 95.00 },
    ]

    for (const t of tarifs) {
      await client.query(
        'INSERT INTO ftto_tarifs (code_article, designation, bpu) VALUES ($1, $2, $3)',
        [t.code, t.designation, t.bpu]
      )
    }

    console.log(`✅ ${tarifs.length} tarifs FTTO insérés avec succès`)
  } catch (err) {
    console.error('❌ Erreur:', err.message)
  } finally {
    await client.end()
  }
}

setupFttoTarifs()
