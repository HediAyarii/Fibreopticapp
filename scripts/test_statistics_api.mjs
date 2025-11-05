import fetch from 'node-fetch';

const testAPI = async () => {
  const startDate = '2025-05-01';
  const endDate = '2025-11-05';
  const type = 'penalties';
  
  console.log('🧪 Test de l\'API /api/statistics');
  console.log(`📅 Période: ${startDate} à ${endDate}`);
  console.log(`📊 Type: ${type}\n`);
  
  try {
    const url = `http://localhost:3000/api/statistics?startDate=${startDate}&endDate=${endDate}&type=${type}`;
    console.log(`🔗 URL: ${url}\n`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('✅ Réponse API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.statistics.penalties) {
      console.log('\n📊 Pénalités par statut:');
      console.log(JSON.stringify(data.statistics.penalties.byStatus, null, 2));
      
      console.log('\n👥 Pénalités par employé:');
      console.log(JSON.stringify(data.statistics.penalties.byEmployee, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testAPI();
