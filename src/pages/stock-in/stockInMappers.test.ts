import { describe, expect, it } from 'vitest'
import {
  mapPriceEditItemToPayload,
  mapStockInPackToPayload,
  mapStockInItemToPayload,
  normalizeStockInBatchForForm,
  normalizeStockInPackForForm,
} from '@/pages/stock-in/stockInMappers'

describe('stockInMappers', () => {
  it('normalizes legacy batch fields for the form', () => {
    expect(
      normalizeStockInBatchForForm({
        batchId: 9,
        batchNo: 'B-09',
        batchProductionDate: '2026-04-01T00:00:00',
        batchExpiryDate: '2026-09-30T00:00:00',
        batchCertificateNo: 'CERT-9',
        batchTestDate: '2026-04-02T00:00:00',
        batchTestReport: 1,
      }),
    ).toEqual({
      batchId: 9,
      batchNumber: 'B-09',
      batchNo: 'B-09',
      batchProductionDate: '2026-04-01',
      expiryDate: '2026-09-30',
      batchExpiryDate: '2026-09-30',
      batchCertificateNo: 'CERT-9',
      batchTestDate: '2026-04-02',
      batchTestReport: 1,
      quantity: null,
    })
  })

  it('normalizes legacy pack fields for the form', () => {
    expect(
      normalizeStockInPackForForm({
        sipPackTypeId: 4,
        sipPackSize: '12 pcs',
        sipPackQty: 8,
        sipPackRemarks: 'Blue carton',
        packTypeName: 'Carton',
      }),
    ).toEqual({
      packId: undefined,
      packDetails: '12 pcs - Blue carton',
      packQuantity: 8,
      packTypeId: 4,
      packTypeName: 'Carton',
      sipPackTypeId: 4,
      sipPackSize: '12 pcs',
      sipPackQty: 8,
      sipPackRemarks: 'Blue carton',
    })
  })

  it('maps form items back to a dual-compatible payload', () => {
    expect(
      mapStockInItemToPayload({
        sidProductId: 77,
        productName: 'Item 77',
        sidDeclaredQty: 10,
        sidConfirmedQty: null,
        sidDeclaredUnitPrice: 4.5,
        sidConfirmedUnitPrice: null,
        sidProductStrength: null,
        sidBatches: [
          {
            batchId: 9,
            batchNumber: 'B-09',
            batchNo: 'B-09',
            batchProductionDate: '2026-04-01',
            expiryDate: '2026-09-30',
            batchExpiryDate: '2026-09-30',
            batchCertificateNo: 'CERT-9',
            batchTestDate: '2026-04-02',
            batchTestReport: 1,
            quantity: null,
          },
        ],
        sidPacks: [
          {
            packDetails: '12 - Blue carton',
            packQuantity: 8,
            packTypeId: 4,
            packTypeName: 'Carton',
            sipPackTypeId: 4,
            sipPackSize: '12',
            sipPackQty: 8,
            sipPackRemarks: 'Blue carton',
          },
        ],
        sidMappedProductId: null,
        sidMappedProductName: null,
      }),
    ).toEqual({
      sidId: undefined,
      sidProductId: 77,
      productName: 'Item 77',
      sidDeclaredQty: 10,
      sidConfirmedQty: null,
      sidDeclaredUnitPrice: 4.5,
      sidConfirmedUnitPrice: null,
      sidProductStrength: null,
      sidBatches: [
        {
          batchId: 9,
          batchNo: 'B-09',
          batchProductionDate: '2026-04-01',
          batchExpiryDate: '2026-09-30',
          batchCertificateNo: 'CERT-9',
          batchTestDate: '2026-04-02',
          batchTestReport: 1,
        },
      ],
      sidPacks: [
        {
          sipPackTypeId: 4,
          sipPackSize: 12,
          sipPackQty: 8,
          sipPackRemarks: 'Blue carton',
          packTypeName: 'Carton',
        },
      ],
      sidMappedProductId: null,
      sidMappedProductName: null,
    })
  })

  it('maps pack size as a numeric JSON value for the update payload', () => {
    expect(
      mapStockInPackToPayload({
        packDetails: '25 - Drum',
        packQuantity: 4,
        packTypeId: 2,
        packTypeName: 'Drum',
        sipPackTypeId: 2,
        sipPackSize: '25',
        sipPackQty: 4,
        sipPackRemarks: 'Warehouse',
      }),
    ).toEqual({
      sipPackTypeId: 2,
      sipPackSize: 25,
      sipPackQty: 4,
      sipPackRemarks: 'Warehouse',
      packTypeName: 'Drum',
    })
  })

  it('maps price-edit items with confirmed values synced from declared values', () => {
    expect(
      mapPriceEditItemToPayload({
        sidProductId: 88,
        productName: 'Item 88',
        sidDeclaredQty: 6,
        sidConfirmedQty: null,
        sidDeclaredUnitPrice: 9.75,
        sidConfirmedUnitPrice: 3.5,
        sidProductStrength: null,
        sidBatches: [],
        sidPacks: [],
        sidMappedProductId: null,
        sidMappedProductName: null,
      }),
    ).toEqual({
      sidId: undefined,
      sidProductId: 88,
      productName: 'Item 88',
      sidDeclaredQty: 6,
      sidConfirmedQty: 6,
      sidDeclaredUnitPrice: 9.75,
      sidConfirmedUnitPrice: 9.75,
      sidProductStrength: null,
      sidBatches: [],
      sidPacks: [],
      sidMappedProductId: null,
      sidMappedProductName: null,
    })
  })
})