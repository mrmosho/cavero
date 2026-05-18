import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * create-bosta-shipment — called from admin when order is ready_to_ship
 * Required secrets: BOSTA_API_KEY, BOSTA_PICKUP_ADDRESS_ID
 */

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const BOSTA_READY = false // flip to true when Bosta account is ready

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { order_id } = await req.json()
    if (!order_id) return new Response(JSON.stringify({ error: 'order_id required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order } = await supabase.from('orders').select('*').eq('id', order_id).single()
    if (!order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } })

    if (!BOSTA_READY) {
      // Stub: just update status without creating real shipment
      await supabase.from('orders').update({ status: 'shipped' }).eq('id', order_id)
      return new Response(JSON.stringify({ success: true, stub: true, message: 'Bosta not yet integrated. Status updated to shipped.' }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const addr = order.shipping_address
    const bostaRes = await fetch('https://app.bosta.co/api/v2/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': Deno.env.get('BOSTA_API_KEY')! },
      body: JSON.stringify({
        type: 10,
        specs: { packageType: 'PARCEL', size: 'SMALL' },
        receiver: { firstName: addr.name.split(' ')[0], lastName: addr.name.split(' ').slice(1).join(' ')||'N/A', phone: addr.phone, email: order.guest_email },
        dropOffAddress: { city: addr.governorate, firstLine: addr.line1, secondLine: addr.line2||'' },
        pickupAddress: { _id: Deno.env.get('BOSTA_PICKUP_ADDRESS_ID') },
        cod: 0,
        notes: order.notes||'',
        businessReference: order.id,
      }),
    })

    if (!bostaRes.ok) { const err = await bostaRes.text(); return new Response(JSON.stringify({ error: 'Bosta error', details: err }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }) }

    const bostaData = await bostaRes.json()
    await supabase.from('orders').update({ status: 'shipped', bosta_shipment_id: bostaData._id, bosta_tracking_no: bostaData.trackingNumber }).eq('id', order_id)

    return new Response(JSON.stringify({ success: true, shipmentId: bostaData._id, trackingNo: bostaData.trackingNumber }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
