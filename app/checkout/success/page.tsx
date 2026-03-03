import CheckoutSuccessClient from "./CheckoutSuccessClient"

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string
    paypal?: string
    token?: string
  }>
}) {
  const sp = await searchParams

  return (
    <CheckoutSuccessClient
      sessionId={sp?.session_id ?? null}
      paypalFlag={sp?.paypal ?? null}
      paypalToken={sp?.token ?? null}
    />
  )
}