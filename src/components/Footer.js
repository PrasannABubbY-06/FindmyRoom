import React from "react";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} FindMyRoom. Built with Passion for Students & Job Seekers.</p>
        <p style={{ marginTop: "5px", opacity: 0.5, fontSize: "0.75rem" }}>
          Providing trust, premium quality, and seamless room searching.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
