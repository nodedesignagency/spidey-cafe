export default function StatusBar() {
  return (
    <div className="statusbar">
      <div className="statusbar__time">
        9:41
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M11.5 .5 .8 5.1c-.5.2-.4.9.1 1l4.3 1 1 4.3c.1.5.8.6 1 .1z" />
        </svg>
      </div>
      <div className="statusbar__island" />
      <div className="statusbar__right">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="5" y="4" width="3" height="8" rx="1" opacity=".45" />
          <rect x="10" y="2" width="3" height="10" rx="1" opacity=".25" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M1 4.2a10 10 0 0 1 14 0M3.6 7a6.4 6.4 0 0 1 8.8 0" />
          <circle cx="8" cy="9.8" r="1" fill="currentColor" stroke="none" />
        </svg>
        <div className="statusbar__battery">
          <span>82</span>
        </div>
      </div>
    </div>
  )
}
