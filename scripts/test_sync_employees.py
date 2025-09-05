#!/usr/bin/env python3
"""
Script pour tester la synchronisation des employés
"""

import requests
import json

def test_sync_employees():
    """Tester la synchronisation des employés"""
    try:
        print("Test de synchronisation des employés...")
        
        # Appeler l'API de synchronisation
        response = requests.post('http://localhost:3000/api/sync-employees')
        
        if response.status_code == 200:
            result = response.json()
            print(f"[SUCCES] Synchronisation réussie:")
            print(f"  - {result['stats']['created']} employés créés")
            print(f"  - {result['stats']['updated']} employés mis à jour")
            print(f"  - {result['stats']['total']} employés au total")
        else:
            print(f"[ERREUR] Erreur HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"[ERREUR] Erreur lors du test: {e}")

if __name__ == "__main__":
    test_sync_employees()
