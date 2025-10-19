"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface FooterDetails {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  copyright?: string;
  unsubscribeText?: string;
}

interface FooterProps {
  details?: FooterDetails;
  showFooter?: boolean;
}

const Footer: React.FC<FooterProps> = ({ details, showFooter = true }) => {
  if (!showFooter || !details) {
    return null;
  }

  const {
    companyName,
    address,
    phone,
    email,
    website,
    socialLinks,
    copyright,
    unsubscribeText
  } = details;

  return (
    <Card className="mt-8 border-t-2 border-primary/20">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Company Info */}
          <div className="space-y-3">
            {companyName && (
              <h3 className="text-lg font-semibold text-foreground">
                {companyName}
              </h3>
            )}
            {address && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {address}
              </p>
            )}
            {phone && (
              <p className="text-sm text-muted-foreground">
                📞 {phone}
              </p>
            )}
            {email && (
              <p className="text-sm text-muted-foreground">
                ✉️ {email}
              </p>
            )}
            {website && (
              <p className="text-sm text-muted-foreground">
                🌐 <a href={website} className="text-primary hover:underline">
                  {website}
                </a>
              </p>
            )}
          </div>

          {/* Social Links */}
          {socialLinks && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Follow Us</h4>
              <div className="flex flex-wrap gap-3">
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Legal */}
          <div className="space-y-3">
            {copyright && (
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} {copyright}
              </p>
            )}
            {unsubscribeText && (
              <p className="text-xs text-muted-foreground">
                {unsubscribeText}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-4" />
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            This newsletter was generated with AI assistance
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Footer;
