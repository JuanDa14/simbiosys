import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { crearPedido, getProductos } from '../services/api';
import type { CartItem, Product } from '../types';

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function CartScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductos();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.precio * item.cantidad, 0),
    [cart],
  );

  const addToCart = (product: Product) => {
    const raw = quantities[product.id] ?? '1';
    const cantidad = Number.parseInt(raw, 10);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresa una cantidad mayor a 0.');
      return;
    }

    if (cantidad > product.stock) {
      Alert.alert(
        'Stock insuficiente',
        `Solo hay ${product.stock} unidades de ${product.nombre}.`,
      );
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nuevaCantidad = existing.cantidad + cantidad;
        if (nuevaCantidad > product.stock) {
          Alert.alert(
            'Stock insuficiente',
            `El carrito ya tiene ${existing.cantidad}. Stock disponible: ${product.stock}.`,
          );
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, cantidad: nuevaCantidad }
            : item,
        );
      }
      return [...prev, { product, cantidad }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const confirmOrder = async () => {
    if (!cliente.trim()) {
      Alert.alert('Cliente requerido', 'Ingresa el nombre del cliente.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega al menos un producto.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await crearPedido({
        cliente: cliente.trim(),
        items: cart.map((item) => ({
          productoId: item.product.id,
          cantidad: item.cantidad,
        })),
      });

      Alert.alert(
        'Pedido confirmado',
        `Código: ${created.codigoPedido}\nTotal: ${formatMoney(created.total)}`,
      );
      setCart([]);
      setCliente('');
      setQuantities({});
      await loadProducts();
    } catch (err) {
      Alert.alert(
        'Error al confirmar',
        err instanceof Error ? err.message : 'No se pudo registrar el pedido.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Cargando productos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.button} onPress={() => void loadProducts()}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo pedido</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del cliente"
        value={cliente}
        onChangeText={setCliente}
        autoCapitalize="words"
      />

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        ListHeaderComponent={<Text style={styles.section}>Catálogo</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{item.nombre}</Text>
              <Text style={styles.muted}>
                {item.codigo} · {formatMoney(item.precio)} · Stock: {item.stock}
              </Text>
            </View>
            <TextInput
              style={styles.qtyInput}
              keyboardType="number-pad"
              value={quantities[item.id] ?? '1'}
              onChangeText={(text) =>
                setQuantities((prev) => ({ ...prev, [item.id]: text }))
              }
            />
            <Pressable style={styles.smallButton} onPress={() => addToCart(item)}>
              <Text style={styles.buttonText}>+</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.cartSection}>
            <Text style={styles.section}>Carrito</Text>
            {cart.length === 0 ? (
              <Text style={styles.muted}>Sin productos en el carrito.</Text>
            ) : (
              cart.map((item) => (
                <View key={item.product.id} style={styles.row}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{item.product.nombre}</Text>
                    <Text style={styles.muted}>
                      {item.cantidad} x {formatMoney(item.product.precio)} ={' '}
                      {formatMoney(item.product.precio * item.cantidad)}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.product.id)}
                  >
                    <Text style={styles.buttonText}>Quitar</Text>
                  </Pressable>
                </View>
              ))
            )}

            <Text style={styles.total}>Total: {formatMoney(total)}</Text>

            <Pressable
              style={[styles.button, submitting && styles.buttonDisabled]}
              disabled={submitting}
              onPress={() => void confirmOrder()}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Confirmar Pedido</Text>
              )}
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#f7f7f7',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  muted: {
    color: '#666',
  },
  errorText: {
    color: '#b00020',
    textAlign: 'center',
  },
  qtyInput: {
    width: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 6,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  smallButton: {
    backgroundColor: '#1a5f4a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButton: {
    backgroundColor: '#8a2b2b',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cartSection: {
    paddingBottom: 32,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 12,
  },
  button: {
    backgroundColor: '#1a5f4a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
