import Link from "next/link"

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-20">
        <div className="text-sm text-neutral-500">Checkout</div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
          Zahlung abgebrochen
        </h1>
        <p className="mt-6 text-neutral-600">
          Kein Problem – du kannst jederzeit erneut auschecken.
        </p>

        <div className="mt-10">
          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 text-sm hover:opacity-85 transition"
          >
            Zurück zum Warenkorb
          </Link>
        </div>
      </div>
    </main>
  )
}