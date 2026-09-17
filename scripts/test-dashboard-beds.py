import subprocess, json, time

# Test the stats API to verify beds are included in woreda data
result = subprocess.run(
    ["curl", "-s", "http://localhost:3000/api/guesthouses/stats"],
    capture_output=True, text=True, timeout=10
)

try:
    data = json.loads(result.stdout)
    print("=== Stats API Response ===")
    print(f"Total: {data.get('total')}")
    print(f"Total Rooms: {data.get('totalRooms')}")
    print(f"Sub-City Beds: {json.dumps(data.get('subCityBeds', {}), indent=2)}")
    
    woreda_data = data.get('woredaBySubCity', {})
    for sub_city, woredas in woreda_data.items():
        print(f"\n--- {sub_city} ---")
        for w in woredas:
            print(f"  {w.get('area')}: {w.get('count')} GH, {w.get('beds')} beds")
    
    # Verify beds field exists
    has_beds = all(
        'beds' in w 
        for ws in woreda_data.values() 
        for w in ws
    )
    print(f"\n✅ All woredas have 'beds' field: {has_beds}")
    print(f"✅ subCityBeds present: {'subCityBeds' in data}")
    
except json.JSONDecodeError:
    print("Failed to parse JSON:", result.stdout[:500])
