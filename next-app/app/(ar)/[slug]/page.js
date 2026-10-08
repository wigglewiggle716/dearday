import "../../home.css";
import { MigrationPlaceholder } from "../../../components/migration-preview";
import { CartPage } from "../../../components/cart-provider";
import { CategoryCatalogPage } from "../../../components/live-catalog";
import OccasionsPage from "../../../components/occasions-page";
import "../../occasions.css";

export default async function ArabicPreviewPage({ params }) {
  const { slug } = await params;
  if (slug === "occasions") return <OccasionsPage locale="ar" />;
  if (slug === "cart") return <CartPage locale="ar" />;
  if (["gifts","cake","flowers"].includes(slug)) return <CategoryCatalogPage locale="ar" slug={slug} />;
  return <MigrationPlaceholder locale="ar" slug={slug} />;
}
