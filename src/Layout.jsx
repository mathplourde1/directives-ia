import React from 'react';

export default function Layout({ children }) {
  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600;1,700&display=swap');

        body, input, textarea, select, button {
          font-family: "Source Sans 3", "Source Sans Pro", SourceSansPro, -apple-system, Roboto, "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
          font-size: 1em;
          font-weight: 400;
          color: #000;
        }

        /* Summaries and exports keep Arial */
        .synthese-section table,
        .synthese-section table td,
        .synthese-section table th,
        .synth-table,
        .synth-table td,
        .synth-table th {
          font-family: Arial, sans-serif !important;
        }
      `}</style>
      {children}
    </div>
  );
}