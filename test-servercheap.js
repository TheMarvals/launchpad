const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const token = process.env.SERVERCHEAP_API_TOKEN;

async function fetchServers() {
  try {
    const res = await fetch('https://panel.servercheap.com/api/v1/servers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      console.log('Error fetching servers:', res.status, res.statusText);
      return;
    }
    
    const data = await res.json();
    console.log("=== SERVERS LIST ===");
    if (data.data && Array.isArray(data.data)) {
        data.data.forEach(s => {
            console.log(`- ID: ${s.id} | Name: ${s.name}`);
        });
    } else {
        console.log(data);
    }
  } catch (err) {
    console.log('Exception:', err);
  }
}

fetchServers();
