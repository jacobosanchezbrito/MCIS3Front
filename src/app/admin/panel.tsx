import ProductImageManager from "@/components/ProductImageManager";
import DecreaseStockButton from "@/components/DecreaseStockButton";

export default function PanelPage() {
  const producto = {
    id: 1,
    nombre: "Café especial",
    imagenUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    imagenPublicId: "demo/sample",
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Panel de producto</h1>

      <ProductImageManager
        productId={producto.id}
        imagenUrl={producto.imagenUrl}
        imagenPublicId={producto.imagenPublicId}
        onChanged={() => {
          // aquí puedes volver a hacer fetch o router.refresh()
          console.log("Imagen cambiada o eliminada");
        }}
      />

      <DecreaseStockButton
        productId={producto.id}
        defaultAmount={1}
        onChanged={() => {
          console.log("Stock disminuido");
        }}
      />
    </div>
  );
}
