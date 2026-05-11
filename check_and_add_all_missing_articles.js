const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkAndAddAllMissingArticles() {
  try {
    console.log('🔍 Vérification de tous les articles manquants pour ERT OUEST...\n');

    // Articles à vérifier/ajouter
    const articlesToCheck = [
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
      },
      {
        company: 'ERT OUEST',
        service_code: 'RAC_PBO_FACADE',
        category: 'RACC',
        prix_base: 140,
        prix_tech: 50
      },
      {
        company: 'ERT OUEST',
        service_code: 'FOURREAU_CASSE_PRIVE',
        category: 'SAV',
        prix_base: 200,
        prix_tech: 50
      },
      {
        company: 'ERT OUEST',
        service_code: 'FOURREAU_CASSE_BETON',
        category: 'SAV',
        prix_base: 400,
        prix_tech: 50
      }
    ];

    let added = 0;
    let updated = 0;
    let alreadyExists = 0;

    for (const article of articlesToCheck) {
      // Vérifier d'abord si l'article existe
      const checkResult = await pool.query(`
        SELECT * FROM company_pricing
        WHERE company_name = $1 
          AND service_code = $2 
          AND category = $3
      `, [article.company, article.service_code, article.category]);

      if (checkResult.rows.length > 0) {
        console.log(`✓ Existe déjà: ${article.service_code} - Base: ${checkResult.rows[0].prix_base}€, Tech: ${checkResult.rows[0].prix_tech}€`);
        alreadyExists++;
      } else {
        // Ajouter l'article
        await pool.query(`
          INSERT INTO company_pricing (company_name, service_code, category, prix_base, prix_tech)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          article.company,
          article.service_code,
          article.category,
          article.prix_base,
          article.prix_tech
        ]);

        console.log(`✅ AJOUTÉ: ${article.service_code} (${article.category}) - Base: ${article.prix_base}€, Tech: ${article.prix_tech}€`);
        added++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   - Articles ajoutés: ${added}`);
    console.log(`   - Articles déjà existants: ${alreadyExists}`);

    // Vérifier le total d'articles ERT OUEST
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM company_pricing
      WHERE company_name = 'ERT OUEST'
    `);

    console.log(`   - Total articles ERT OUEST: ${countResult.rows[0].total}`);

    // Lister tous les articles ERT OUEST
    console.log('\n📋 Liste complète des articles ERT OUEST dans company_pricing:');
    const listResult = await pool.query(`
      SELECT service_code, category, prix_base, prix_tech
      FROM company_pricing
      WHERE company_name = 'ERT OUEST'
      ORDER BY service_code
    `);

    listResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.service_code.padEnd(25)} | ${row.category.padEnd(6)} | Base: ${row.prix_base}€ | Tech: ${row.prix_tech}€`);
    });

    console.log('\n✅ Opération terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkAndAddAllMissingArticles();
