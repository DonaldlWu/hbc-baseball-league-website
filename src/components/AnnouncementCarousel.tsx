"use client";

import { useState, useEffect } from "react";
import { getLatestAnnouncements } from "@/src/lib/dataLoader";
import type { Announcement } from "@/src/types";

export default function AnnouncementCarousel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const data = await getLatestAnnouncements(5);
        setAnnouncements(data);
      } catch (error) {
        console.error("Failed to load announcements:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  // 自動輪播
  useEffect(() => {
    if (announcements.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // 每 5 秒切換

    return () => clearInterval(interval);
  }, [announcements.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + announcements.length) % announcements.length
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handleImageError = (imageUrl: string) => {
    setImageErrors((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">載入公告中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">目前沒有公告</div>
      </div>
    );
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          <span className="text-2xl">📢</span>
          聯盟公告
        </h2>
      </div>

      {/* Carousel Content */}
      <div className="relative">
        {/* Main Content */}
        <div className="p-6">
          {/* Category & Date */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block px-3 py-1 bg-primary-100 text-gray-700 rounded-full text-sm font-medium">
              {currentAnnouncement.category}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(currentAnnouncement.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {currentAnnouncement.pinned && (
              <span className="text-red-500 mr-2">📌</span>
            )}
            {currentAnnouncement.title}
          </h3>

          {/* Images */}
          {currentAnnouncement.images.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-1 gap-4">
                {currentAnnouncement.images.map((image, idx) => (
                  <div
                    key={idx}
                    className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden"
                  >
                    {!imageErrors[image.url] ? (
                      <img
                        src={`/${image.url}`}
                        alt={image.alt}
                        className="absolute inset-0 w-full h-full object-contain"
                        onError={() => handleImageError(image.url)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <svg
                            className="w-16 h-16 mx-auto mb-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-sm">圖片載入失敗</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div
            className="announcement-content text-gray-700 leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: currentAnnouncement.content }}
          />
          <style jsx>{`
            .announcement-content {
              line-height: 1.75;
            }
            .announcement-content p {
              margin-bottom: 1rem;
            }
            .announcement-content p:last-child {
              margin-bottom: 0;
            }
            .announcement-content h1,
            .announcement-content h2,
            .announcement-content h3,
            .announcement-content h4 {
              font-weight: 700;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              color: #1f2937;
            }
            .announcement-content h1 {
              font-size: 1.5rem;
            }
            .announcement-content h2 {
              font-size: 1.25rem;
            }
            .announcement-content h3 {
              font-size: 1.125rem;
            }
            .announcement-content strong,
            .announcement-content b {
              font-weight: 600;
              color: #111827;
            }
            .announcement-content em,
            .announcement-content i {
              font-style: italic;
            }
            .announcement-content ul,
            .announcement-content ol {
              margin-left: 1.5rem;
              margin-bottom: 1rem;
            }
            .announcement-content ul {
              list-style-type: disc;
            }
            .announcement-content ol {
              list-style-type: decimal;
            }
            .announcement-content li {
              margin-bottom: 0.5rem;
            }
            .announcement-content a {
              color: #2563eb;
              text-decoration: underline;
            }
            .announcement-content a:hover {
              color: #1d4ed8;
            }
            .announcement-content blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 1rem;
              margin: 1rem 0;
              color: #6b7280;
              font-style: italic;
            }
            .announcement-content code {
              background-color: #f3f4f6;
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
              font-family: monospace;
              font-size: 0.875em;
            }
            .announcement-content pre {
              background-color: #1f2937;
              color: #f9fafb;
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin-bottom: 1rem;
            }
            .announcement-content pre code {
              background-color: transparent;
              padding: 0;
              color: inherit;
            }
            .announcement-content hr {
              border: 0;
              border-top: 1px solid #e5e7eb;
              margin: 1.5rem 0;
            }
            .announcement-content table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1rem;
            }
            .announcement-content th,
            .announcement-content td {
              border: 1px solid #e5e7eb;
              padding: 0.5rem;
              text-align: left;
            }
            .announcement-content th {
              background-color: #f9fafb;
              font-weight: 600;
            }
          `}</style>

          {/* Links */}
          {currentAnnouncement.links.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {currentAnnouncement.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-gray-700 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  {link.label}
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        {announcements.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
              aria-label="Previous announcement"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
              aria-label="Next announcement"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Indicators */}
      {announcements.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-50">
          {announcements.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-primary-600"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to announcement ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
