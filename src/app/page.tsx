import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirige automáticamente al usuario al login cuando entra a la raíz /
  redirect("/auth/signin");
}