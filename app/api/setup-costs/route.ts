import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// POST - Créer les tables de coûts
export async function POST() {
  try {
    console.log('🔧 Création des tables de coûts...')

    // Créer la table des catégories de coûts
    await query(`
      CREATE TABLE IF NOT EXISTS cost_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Créer la table des coûts fixes
    await query(`
      CREATE TABLE IF NOT EXISTS fixed_costs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Créer la table des coûts variables
    await query(`
      CREATE TABLE IF NOT EXISTS variable_costs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, month, year)
      )
    `)

    // Créer la table des coûts mensuels
    await query(`
      CREATE TABLE IF NOT EXISTS monthly_costs (
        id SERIAL PRIMARY KEY,
        month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
        year INTEGER NOT NULL,
        total_fixed_costs DECIMAL(10,2) DEFAULT 0,
        total_variable_costs DECIMAL(10,2) DEFAULT 0,
        total_costs DECIMAL(10,2) DEFAULT 0,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(month, year)
      )
    `)

    // Insérer les catégories par défaut
    await query(`
      INSERT INTO cost_categories (name, description, color) VALUES
      ('Personnel', 'Salaires et charges sociales', '#EF4444'),
      ('Loyer', 'Loyers et charges locatives', '#F59E0B'),
      ('Équipement', 'Achat et maintenance d''équipements', '#10B981'),
      ('Transport', 'Carburant et frais de transport', '#3B82F6'),
      ('Communication', 'Téléphone, internet, abonnements', '#8B5CF6'),
      ('Formation', 'Formations et certifications', '#EC4899'),
      ('Assurance', 'Assurances diverses', '#6B7280'),
      ('Autres', 'Autres dépenses', '#9CA3AF')
      ON CONFLICT (name) DO NOTHING
    `)

    // Créer les index
    await query(`
      CREATE INDEX IF NOT EXISTS idx_fixed_costs_active ON fixed_costs(is_active)
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_variable_costs_month_year ON variable_costs(month, year)
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_monthly_costs_month_year ON monthly_costs(month, year)
    `)

    // Créer la fonction de calcul des coûts mensuels
    await query(`
      CREATE OR REPLACE FUNCTION calculate_monthly_costs(target_month INTEGER, target_year INTEGER)
      RETURNS DECIMAL(10,2) AS $$
      DECLARE
          fixed_total DECIMAL(10,2) := 0;
          variable_total DECIMAL(10,2) := 0;
          total_costs DECIMAL(10,2) := 0;
      BEGIN
          -- Calculer le total des coûts fixes actifs
          SELECT COALESCE(SUM(amount), 0) INTO fixed_total
          FROM fixed_costs 
          WHERE is_active = true;
          
          -- Calculer le total des coûts variables pour le mois/année
          SELECT COALESCE(SUM(amount), 0) INTO variable_total
          FROM variable_costs 
          WHERE month = target_month AND year = target_year;
          
          -- Calculer le total
          total_costs := fixed_total + variable_total;
          
          -- Insérer ou mettre à jour le calcul mensuel
          INSERT INTO monthly_costs (month, year, total_fixed_costs, total_variable_costs, total_costs)
          VALUES (target_month, target_year, fixed_total, variable_total, total_costs)
          ON CONFLICT (month, year) 
          DO UPDATE SET 
              total_fixed_costs = EXCLUDED.total_fixed_costs,
              total_variable_costs = EXCLUDED.total_variable_costs,
              total_costs = EXCLUDED.total_costs,
              calculated_at = CURRENT_TIMESTAMP;
          
          RETURN total_costs;
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log('✅ Tables de coûts créées avec succès')

    return NextResponse.json({
      success: true,
      message: 'Tables de coûts créées avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur création tables:', error)
    return NextResponse.json({ 
      error: 'Erreur création tables',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
