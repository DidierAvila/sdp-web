export interface Order {
  orderId: number;
  custId: number;               // Cambiado de customerId a custId según swagger
  empId?: number;               // Cambiado de employeeId a empId según swagger
  orderDate: string;            // ISO date string
  requiredDate?: string;
  shippedDate?: string;
  shipperId?: number;           // Cambiado de shipVia a shipperId según swagger
  freight?: number;
  shipName?: string;
  shipAddress?: string;
  shipCity?: string;
  shipRegion?: string;
  shipPostalCode?: string;
  shipCountry?: string;
  status?: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'; // Campo adicional para UI
  // Campos adicionales para UI que no existen en el swagger
  customer?: {
    custId: number;
    companyName: string;
  };
  orderDetails?: OrderDetail[];
}

export interface OrderDetail {
  orderDetailId?: number;
  orderId?: number;
  productId: number;
  unitPrice: number;
  quantity?: number;    // Campo utilizado en la UI
  qty?: number;         // Campo utilizado en el API (reemplaza a quantity)
  discount: number;
  product?: {
    productId: number;
    productName: string;
  };
}
