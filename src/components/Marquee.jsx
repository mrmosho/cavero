const ITEMS = ['Made to order', 'Studio-crafted in Cairo', 'Ships in 5–7 days', 'Free delivery in Cairo', 'Custom pieces available']
export default function Marquee() {
  return (
    <div className="marquee-strip">
      <div className="marquee-inner">
        {[...ITEMS, ...ITEMS].map((item, i) => <span key={i} className="marquee-item">{item}<span className="marquee-dot" /></span>)}
      </div>
    </div>
  )
}