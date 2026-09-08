export default function EmptyState({ headline, detail }) {
  return (
    <div className="empty">
      <p className="empty-headline">{headline}</p>
      {detail && <p className="empty-detail">{detail}</p>}
    </div>
  )
}
