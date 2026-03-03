import ProductCarousel from "@/components/shop/ProductCarousel"
import {client} from "@/sanity/lib/client"

const randomQuery = `*[_type=="product"]{
  _id,
  title,
  price,
  slug,
  images,
  stock,
  condition,
  deliveryTimeLabel,
  shippingNote
}`

export default async function RandomProductsCarousel({
  title = "Weitere Produkte",
  limit = 20,
}: {
  title?: string
  limit?: number
}) {
  const all = await client.fetch(randomQuery, {}, {perspective: "published"})
  const arr = Array.isArray(all) ? all : []

  // client-seitig randomisieren wäre auch ok, aber hier server-seitig:
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  const items = shuffled.slice(0, Math.max(5, Math.min(50, limit)))

  return <ProductCarousel title={title} items={items} />
}