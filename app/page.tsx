"use client"

import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    // Redirect to the static HTML portfolio
    window.location.href = "/index.html"
  }, [])

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FDF6F0",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "60px",
            height: "2px",
            background: "#0A0A0A",
            position: "relative",
            overflow: "hidden",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "#E85D04",
              animation: "loaderSlide 1s infinite",
            }}
          />
        </div>
        <p
          style={{
            marginTop: "20px",
            color: "#6B6B6B",
            fontSize: "14px",
            letterSpacing: "0.1em",
          }}
        >
          Loading portfolio...
        </p>
        <style>{`
          @keyframes loaderSlide {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    </div>
  )
}
