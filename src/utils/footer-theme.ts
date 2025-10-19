// Generate footer HTML from footer details
export function generateFooterHTML(footerDetails: any, themeColors: any = null): string {
  if (!footerDetails) return "";
  
  const {
    companyName,
    address,
    phone,
    email,
    website,
    socialLinks,
    copyright,
    unsubscribeText
  } = footerDetails;


  const primaryColor = themeColors?.primary || "#3b82f6";
  const foregroundColor = themeColors?.foreground || "#0f172a";
  const backgroundColor = themeColors?.background || "#ffffff";

  let footerHTML = `
    <footer style="
      margin-top: 2rem;
      padding: 2rem 1rem;
      background-color: ${backgroundColor};
      border-top: 2px solid ${primaryColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
  `;

  
  if (companyName || address || phone || email || website) {
    footerHTML += `
      <div>
        ${companyName ? `<h3 style="margin: 0 0 1rem 0; color: ${foregroundColor}; font-size: 1.1rem; font-weight: 600;">${companyName}</h3>` : ''}
        ${address ? `<p style="margin: 0.5rem 0; color: ${foregroundColor}; font-size: 0.9rem; line-height: 1.4;">${address.replace(/\n/g, '<br>')}</p>` : ''}
        ${phone ? `<p style="margin: 0.5rem 0; color: ${foregroundColor}; font-size: 0.9rem;">📞 ${phone}</p>` : ''}
        ${email ? `<p style="margin: 0.5rem 0; color: ${foregroundColor}; font-size: 0.9rem;">✉️ ${email}</p>` : ''}
        ${website ? `<p style="margin: 0.5rem 0; color: ${foregroundColor}; font-size: 0.9rem;">🌐 <a href="${website}" style="color: ${primaryColor}; text-decoration: none;">${website}</a></p>` : ''}
      </div>
    `;
  }


  if (socialLinks && (socialLinks.twitter || socialLinks.linkedin || socialLinks.facebook || socialLinks.instagram)) {
    footerHTML += `
      <div>
        <h4 style="margin: 0 0 1rem 0; color: ${foregroundColor}; font-size: 1rem; font-weight: 600;">Follow Us</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
    `;
    
    if (socialLinks.twitter) {
      footerHTML += `<a href="${socialLinks.twitter}" style="color: ${primaryColor}; text-decoration: none; font-size: 0.9rem;">Twitter</a>`;
    }
    if (socialLinks.linkedin) {
      footerHTML += `<a href="${socialLinks.linkedin}" style="color: ${primaryColor}; text-decoration: none; font-size: 0.9rem;">LinkedIn</a>`;
    }
    if (socialLinks.facebook) {
      footerHTML += `<a href="${socialLinks.facebook}" style="color: ${primaryColor}; text-decoration: none; font-size: 0.9rem;">Facebook</a>`;
    }
    if (socialLinks.instagram) {
      footerHTML += `<a href="${socialLinks.instagram}" style="color: ${primaryColor}; text-decoration: none; font-size: 0.9rem;">Instagram</a>`;
    }
    
    footerHTML += `
        </div>
      </div>
    `;
  }

  footerHTML += `
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; text-align: center;">
  `;

  if (copyright) {
    footerHTML += `<p style="margin: 0.5rem 0; color: ${foregroundColor}; font-size: 0.8rem;">© ${new Date().getFullYear()} ${copyright}</p>`;
  }
  
  if (unsubscribeText) {
    footerHTML += `<p style="margin: 0.5rem 0; color: ${foregroundColor}; font-size: 0.8rem;">${unsubscribeText}</p>`;
  }

  footerHTML += `
          <p style="margin: 1rem 0 0 0; color: #6b7280; font-size: 0.8rem;">
            This newsletter was generated with AI assistance
          </p>
        </div>
      </div>
    </footer>
  `;

  return footerHTML;
}

export function applyThemeColors(html: string, themeColors: any = null): string {
  if (!themeColors) return html;
  
  const {
    primary = "#3b82f6",
    secondary = "#64748b", 
    accent = "#f59e0b",
    background = "#ffffff",
    foreground = "#0f172a"
  } = themeColors;

  const themeCSS = `
    <style>
      :root {
        --primary: ${primary};
        --secondary: ${secondary};
        --accent: ${accent};
        --background: ${background};
        --foreground: ${foreground};
      }
      body {
        background-color: ${background};
        color: ${foreground};
      }
      .primary { color: ${primary}; }
      .bg-primary { background-color: ${primary}; }
      .border-primary { border-color: ${primary}; }
      .accent { color: ${accent}; }
      .bg-accent { background-color: ${accent}; }
      a { color: ${primary}; }
      h1, h2, h3, h4, h5, h6 { color: ${foreground}; }
      .btn-primary {
        background-color: ${primary};
        color: ${background};
        border: 1px solid ${primary};
      }
      .btn-secondary {
        background-color: transparent;
        color: ${primary};
        border: 1px solid ${primary};
      }
    </style>
  `;


  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${themeCSS}`);
  } else if (html.includes('<html>')) {
    html = html.replace('<html>', `<html><head>${themeCSS}</head>`);
  } else {
    html = `<!DOCTYPE html><html><head>${themeCSS}</head><body>${html}</body></html>`;
  }

  return html;
}
