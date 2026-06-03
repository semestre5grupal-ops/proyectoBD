process.env.TASA_IVA = '0.15';

const CalculoService = require('../services/calculo.service');

const lineas = (items) => items.map(([cantidad, precio]) => ({
    id_variante: 1,
    pxd_cantidad: cantidad,
    pxd_valor_unitario: precio,
}));

describe('CalculoService.calcular', () => {
    test('calcula correctamente con descuento 0', () => {
        const result = CalculoService.calcular(lineas([[2, 100]]), 0);
        expect(result.subtotal).toBe(200);
        expect(result.base).toBe(200);
        expect(result.iva).toBeCloseTo(30, 4);
        expect(result.total).toBeCloseTo(230, 4);
    });

    test('calcula correctamente con descuento', () => {
        const result = CalculoService.calcular(lineas([[10, 50]]), 100);
        expect(result.subtotal).toBe(500);
        expect(result.base).toBe(400);
        expect(result.iva).toBeCloseTo(60, 4);
        expect(result.total).toBeCloseTo(460, 4);
    });

    test('múltiples líneas', () => {
        const result = CalculoService.calcular(lineas([[3, 10], [2, 20]]), 0);
        expect(result.subtotal).toBe(70);
        expect(result.iva).toBeCloseTo(10.5, 4);
        expect(result.total).toBeCloseTo(80.5, 4);
    });

    test('lanza 400 si no hay líneas', () => {
        expect(() => CalculoService.calcular([], 0)).toThrow();
        try { CalculoService.calcular([], 0); } catch (e) { expect(e.status).toBe(400); }
    });

    test('lanza 400 si cantidad es 0', () => {
        expect(() => CalculoService.calcular(lineas([[0, 100]]), 0)).toThrow();
    });

    test('lanza 400 si descuento supera subtotal', () => {
        expect(() => CalculoService.calcular(lineas([[1, 10]]), 20)).toThrow();
        try { CalculoService.calcular(lineas([[1, 10]]), 20); } catch (e) { expect(e.status).toBe(400); }
    });

    test('lanza 400 si descuento es negativo', () => {
        expect(() => CalculoService.calcular(lineas([[1, 10]]), -1)).toThrow();
    });

    test('descuento igual a subtotal da base 0 e iva 0', () => {
        const result = CalculoService.calcular(lineas([[1, 10]]), 10);
        expect(result.base).toBe(0);
        expect(result.iva).toBe(0);
        expect(result.total).toBe(0);
    });
});

describe('CalculoService.calcularLinea', () => {
    test('devuelve producto correcto', () => {
        expect(CalculoService.calcularLinea(3, 25)).toBe(75);
    });

    test('lanza si cantidad es 0', () => {
        expect(() => CalculoService.calcularLinea(0, 25)).toThrow();
    });
});
