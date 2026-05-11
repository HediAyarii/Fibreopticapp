const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function addMissingArticles() {
  try {
    console.log('🔧 Ajout des articles manquants pour ERT OUEST...\n');

    // Articles à ajouter avec leurs prix
    const missingArticles = [
      {
        company: 'ERT OUEST',
        service_code: 'DEPLACEMENT_OFFERT',
        category: 'SAV',
        prix_base: 10,
        prix_tech: 10
      },
      {
        company: 'ERT OUEST',
        service_code: 'DEPOLLUTION_PM',
        category: 'SAV',
        prix_base: 0,
        prix_tech: 0
      }
    ];

    let added = 0;
    let updated = 0;

    for (const article of missingArticles) {
      const result = await pool.query(`
        INSERT INTO company_pricing (company_name, service_code, category, prix_base, prix_tech)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (company_name, service_code, category) 
        DO UPDATE SET
          prix_base = EXCLUDED.prix_base,
          prix_tech = EXCLUDED.prix_tech,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted
      `, [
        article.company,
        article.service_code,
        article.category,
        article.prix_base,
        article.prix_tech
      ]);

      if (result.rows[0].inserted) {
        console.log(`✅ Ajouté: ${article.service_code} (${article.category}) - Base: ${article.prix_base}€, Tech: ${article.prix_tech}€`);
        added++;
      } else {
        console.log(`🔄 Mis à jour: ${article.service_code} (${article.category}) - Base: ${article.prix_base}€, Tech: ${article.prix_tech}€`);
        updated++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   - Articles ajoutés: ${added}`);
    console.log(`   - Articles mis à jour: ${updated}`);

    // Vérifier le total d'articles ERT OUEST
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM company_pricing
      WHERE company_name = 'ERT OUEST'
    `);

    console.log(`   - Total articles ERT OUEST: ${countResult.rows[0].total}`);
    console.log('\n✅ Opération terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

addMissingArticles();
