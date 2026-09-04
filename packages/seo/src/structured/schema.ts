import type { SchemaNode } from '../types';

// JSON-LD Structured Data Generator
export function generateSchema(schema: SchemaNode): string {
  return JSON.stringify(schema);
}

// Common schema types
export const Schema = {
  // Article
  Article(data: {
    headline: string;
    description?: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image?: string;
    url?: string;
    publisher?: string;
  }): SchemaNode {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.headline,
      description: data.description,
      author: { '@type': 'Person', name: data.author },
      datePublished: data.datePublished,
      dateModified: data.dateModified,
      image: data.image,
      mainEntityOfPage: data.url,
      publisher: {
        '@type': 'Organization',
        name: data.publisher || 'MoveJS'
      }
    };
  },

  // BlogPosting
  BlogPosting(data: {
    headline: string;
    description?: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image?: string;
    url?: string;
  }): SchemaNode {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: data.headline,
      description: data.description,
      author: { '@type': 'Person', name: data.author },
      datePublished: data.datePublished,
      dateModified: data.dateModified,
      image: data.image,
      mainEntityOfPage: data.url
    };
  },

  // Organization
  Organization(data: {
    name: string;
    url?: string;
    logo?: string;
    sameAs?: string[];
    contactPoint?: Array<{
      telephone?: string;
      email?: string;
      contactType: string;
    }>;
  }): SchemaNode {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.name,
      url: data.url,
      logo: data.logo,
      sameAs: data.sameAs,
      contactPoint: data.contactPoint?.map(cp => ({
        '@type': 'ContactPoint',
        ...cp
      }))
    };
  },

  // Product
  Product(data: {
    name: string;
    description?: string;
    image?: string;
    price?: number;
    currency?: string;
    availability?: string;
    rating?: { ratingValue: number; ratingCount: number };
    reviews?: Array<{ author: string; ratingValue: number; reviewBody?: string }>;
  }): SchemaNode {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name,
      description: data.description,
      image: data.image,
      offers: data.price !== undefined ? {
        '@type': 'Offer',
        price: data.price,
        priceCurrency: data.currency || 'USD',
        availability: data.availability || 'https://schema.org/InStock'
      } : undefined,
      aggregateRating: data.rating ? {
        '@type': 'AggregateRating',
        ratingValue: data.rating.ratingValue,
        ratingCount: data.rating.ratingCount
      } : undefined,
      review: data.reviews?.map(review => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: review.author },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.ratingValue
        },
        reviewBody: review.reviewBody
      }))
    };
  },

  // FAQ
  FAQPage(data: Array<{ question: string; answer: string }>): SchemaNode {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.map(qa => ({
        '@type': 'Question',
        name: qa.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: qa.answer
        }
      }))
    };
  },

  // Breadcrumb
  BreadcrumbList(data: Array<{ name: string; url?: string }>): SchemaNode {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: data.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  },

  // WebSite
  WebSite(data: {
    name: string;
    url: string;
    searchAction?: { target: string; queryInput: string };
  }): SchemaNode {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: data.name,
      url: data.url,
      potentialAction: data.searchAction ? {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: data.searchAction.target
        },
        'query-input': data.searchAction.queryInput
      } : undefined
    };
  },

  // Person
  Person(data: {
    name: string;
    jobTitle?: string;
    url?: string;
    image?: string;
    email?: string;
    sameAs?: string[];
  }): SchemaNode {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.name,
      jobTitle: data.jobTitle,
      url: data.url,
      image: data.image,
      email: data.email,
      sameAs: data.sameAs
    };
  }
};

// Generate a full JSON-LD script tag
export function schemaToScriptTag(schema: SchemaNode): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
