export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
}

export interface OrderDetail {
  id: number;
  productoId: number;
  productoNombre?: string | null;
  cantidad: number;
  precioUnitario: number;
  subTotal: number;
}

export interface Order {
  id: number;
  codigoPedido: string;
  cliente: string;
  fecha: string;
  total: number;
  estado: string;
  detalles: OrderDetail[];
}

export interface CartItem {
  product: Product;
  cantidad: number;
}

export interface CreateOrderItemPayload {
  productoId: number;
  cantidad: number;
}

export interface CreateOrderPayload {
  cliente: string;
  items: CreateOrderItemPayload[];
}

export interface CreateOrderResponse {
  id: number;
  codigoPedido: string;
  total: number;
  estado: string;
}

export interface ApiErrorBody {
  message: string;
}
