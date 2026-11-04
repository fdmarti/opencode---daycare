import { redirect } from "next/navigation";

// El perfil del niño todavía no existe como funcionalidad: los ids ya son
// UUID de la base y no hay vista que mostrar. Volver al listado es la única
// acción posible.
export default function KidProfilePage() {
  redirect("/kids");
}
