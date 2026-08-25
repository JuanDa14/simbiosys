IF DB_ID(N'SimbiosysOrdersDB') IS NULL
BEGIN
    CREATE DATABASE SimbiosysOrdersDB;
END
GO

USE SimbiosysOrdersDB;
GO

IF OBJECT_ID(N'dbo.DetallePedidos', N'U') IS NOT NULL DROP TABLE dbo.DetallePedidos;
IF OBJECT_ID(N'dbo.Pedidos', N'U') IS NOT NULL DROP TABLE dbo.Pedidos;
IF OBJECT_ID(N'dbo.Productos', N'U') IS NOT NULL DROP TABLE dbo.Productos;
IF TYPE_ID(N'dbo.DetallePedidoType') IS NOT NULL DROP TYPE dbo.DetallePedidoType;
IF OBJECT_ID(N'dbo.sp_RegistrarPedido', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_RegistrarPedido;
GO

CREATE TABLE dbo.Productos
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Productos PRIMARY KEY,
    Codigo VARCHAR(20) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Precio DECIMAL(18,2) NOT NULL,
    Stock INT NOT NULL,
    CONSTRAINT UQ_Productos_Codigo UNIQUE (Codigo),
    CONSTRAINT CK_Productos_Precio CHECK (Precio >= 0),
    CONSTRAINT CK_Productos_Stock CHECK (Stock >= 0)
);
GO

CREATE TABLE dbo.Pedidos
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Pedidos PRIMARY KEY,
    CodigoPedido VARCHAR(50) NOT NULL,
    Cliente VARCHAR(120) NOT NULL,
    Fecha DATETIME2 NOT NULL CONSTRAINT DF_Pedidos_Fecha DEFAULT (SYSUTCDATETIME()),
    Total DECIMAL(18,2) NOT NULL,
    Estado VARCHAR(20) NOT NULL,
    CONSTRAINT UQ_Pedidos_CodigoPedido UNIQUE (CodigoPedido),
    CONSTRAINT CK_Pedidos_Total CHECK (Total >= 0)
);
GO

CREATE TABLE dbo.DetallePedidos
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DetallePedidos PRIMARY KEY,
    PedidoId INT NOT NULL,
    ProductoId INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    SubTotal DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_DetallePedidos_Pedidos FOREIGN KEY (PedidoId) REFERENCES dbo.Pedidos(Id),
    CONSTRAINT FK_DetallePedidos_Productos FOREIGN KEY (ProductoId) REFERENCES dbo.Productos(Id),
    CONSTRAINT CK_DetallePedidos_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CK_DetallePedidos_PrecioUnitario CHECK (PrecioUnitario >= 0),
    CONSTRAINT CK_DetallePedidos_SubTotal CHECK (SubTotal >= 0)
);
GO

CREATE TYPE dbo.DetallePedidoType AS TABLE
(
    ProductoId INT NOT NULL,
    Cantidad INT NOT NULL
);
GO

CREATE PROCEDURE dbo.sp_RegistrarPedido
    @Cliente VARCHAR(120),
    @Detalle dbo.DetallePedidoType READONLY,
    @PedidoId INT OUTPUT,
    @CodigoPedido VARCHAR(50) OUTPUT,
    @Total DECIMAL(18,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Cliente IS NULL OR LTRIM(RTRIM(@Cliente)) = ''
    BEGIN
        THROW 50001, 'El nombre del cliente es obligatorio.', 1;
    END

    IF NOT EXISTS (SELECT 1 FROM @Detalle)
    BEGIN
        THROW 50002, 'El pedido debe incluir al menos un producto.', 1;
    END

    IF EXISTS (SELECT 1 FROM @Detalle WHERE Cantidad <= 0)
    BEGIN
        THROW 50003, 'La cantidad de cada producto debe ser mayor a cero.', 1;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Agrupar líneas repetidas del mismo producto
        DECLARE @DetalleAgregado TABLE
        (
            ProductoId INT NOT NULL,
            Cantidad INT NOT NULL
        );

        INSERT INTO @DetalleAgregado (ProductoId, Cantidad)
        SELECT ProductoId, SUM(Cantidad)
        FROM @Detalle
        GROUP BY ProductoId;

        -- Validar existencia y stock suficiente
        DECLARE @ProductoIdSinStock INT;
        DECLARE @NombreProducto VARCHAR(100);
        DECLARE @StockDisponible INT;
        DECLARE @CantidadSolicitada INT;

        SELECT TOP (1)
            @ProductoIdSinStock = d.ProductoId,
            @NombreProducto = p.Nombre,
            @StockDisponible = p.Stock,
            @CantidadSolicitada = d.Cantidad
        FROM @DetalleAgregado d
        LEFT JOIN dbo.Productos p WITH (UPDLOCK, ROWLOCK) ON p.Id = d.ProductoId
        WHERE p.Id IS NULL OR p.Stock < d.Cantidad;

        IF @ProductoIdSinStock IS NOT NULL
        BEGIN
            IF @NombreProducto IS NULL
            BEGIN
                DECLARE @MsgProductoInexistente NVARCHAR(200) =
                    N'Producto no encontrado (Id ' + CAST(@ProductoIdSinStock AS NVARCHAR(20)) + N').';
                THROW 50004, @MsgProductoInexistente, 1;
            END

            DECLARE @MsgStock NVARCHAR(300) =
                N'Stock insuficiente para Producto ' + @NombreProducto +
                N' (disponible: ' + CAST(@StockDisponible AS NVARCHAR(20)) +
                N', solicitado: ' + CAST(@CantidadSolicitada AS NVARCHAR(20)) + N').';
            THROW 50005, @MsgStock, 1;
        END

        DECLARE @TotalCalculado DECIMAL(18,2);

        SELECT @TotalCalculado = SUM(CAST(d.Cantidad AS DECIMAL(18,2)) * p.Precio)
        FROM @DetalleAgregado d
        INNER JOIN dbo.Productos p ON p.Id = d.ProductoId;

        DECLARE @NuevoCodigo VARCHAR(50) = CONVERT(VARCHAR(50), NEWID());

        INSERT INTO dbo.Pedidos (CodigoPedido, Cliente, Fecha, Total, Estado)
        VALUES (@NuevoCodigo, LTRIM(RTRIM(@Cliente)), SYSUTCDATETIME(), @TotalCalculado, 'COMPLETADO');

        SET @PedidoId = SCOPE_IDENTITY();
        SET @CodigoPedido = @NuevoCodigo;
        SET @Total = @TotalCalculado;

        INSERT INTO dbo.DetallePedidos (PedidoId, ProductoId, Cantidad, PrecioUnitario, SubTotal)
        SELECT
            @PedidoId,
            d.ProductoId,
            d.Cantidad,
            p.Precio,
            CAST(d.Cantidad AS DECIMAL(18,2)) * p.Precio
        FROM @DetalleAgregado d
        INNER JOIN dbo.Productos p ON p.Id = d.ProductoId;

        UPDATE p
        SET p.Stock = p.Stock - d.Cantidad
        FROM dbo.Productos p
        INNER JOIN @DetalleAgregado d ON d.ProductoId = p.Id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END
GO

-- Datos de prueba
INSERT INTO dbo.Productos (Codigo, Nombre, Precio, Stock) VALUES
('PRD-001', 'Teclado Mecánico', 89.99, 25),
('PRD-002', 'Mouse Inalámbrico', 35.50, 40),
('PRD-003', 'Monitor 24"', 189.00, 12),
('PRD-004', 'Headset USB', 59.90, 18),
('PRD-005', 'Webcam HD', 45.00, 8),
('PRD-006', 'Hub USB-C', 29.99, 30),
('PRD-007', 'SSD 1TB', 99.00, 15),
('PRD-008', 'Cable HDMI', 12.50, 50);
GO
