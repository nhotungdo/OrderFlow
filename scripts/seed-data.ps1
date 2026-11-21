# PowerShell script to seed initial catalog data into OrderFlow
$inventoryApiUrl = "http://localhost:5002/api/inventory/seed"

Write-Host "Seeding products into OrderFlow Inventory Service at $inventoryApiUrl..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $inventoryApiUrl -Method Post -ContentType "application/json"
    Write-Host "Seed completed successfully!" -ForegroundColor Green
    $response | Format-List
} catch {
    Write-Host "Failed to seed data: $_" -ForegroundColor Red
}
