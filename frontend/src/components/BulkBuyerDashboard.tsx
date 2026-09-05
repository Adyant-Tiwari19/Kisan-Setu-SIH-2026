import { RetailMarketplace } from './RetailMarketplace'

/**
 * The supplier/bulk-buyer dashboard currently uses the same database-backed
 * marketplace flow as the retail dashboard. Procurement-specific workflows
 * can be added on top of this live foundation later.
 */
export function BulkBuyerDashboard() {
  return <RetailMarketplace wholesale />
}
