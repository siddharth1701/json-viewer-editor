import type { JSONValue } from '@/types';

export interface Sample {
  id: string;
  name: string;
  description: string;
  data: JSONValue;
}

export const samples: Sample[] = [
  {
    id: 'rest-api',
    name: 'REST API Response',
    description: 'Sample REST API response with user data',
    data: {
      status: 'success',
      data: {
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'admin',
            active: true,
            createdAt: '2024-01-15T10:30:00Z',
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'user',
            active: true,
            createdAt: '2024-02-20T14:45:00Z',
          },
        ],
        pagination: {
          page: 1,
          perPage: 10,
          total: 2,
          totalPages: 1,
        },
      },
      meta: {
        timestamp: '2024-11-04T12:00:00Z',
        version: '1.0.0',
      },
    },
  },
  {
    id: 'package-json',
    name: 'Package Configuration',
    description: 'Sample package.json file',
    data: {
      name: 'my-awesome-project',
      version: '1.0.0',
      description: 'An awesome project',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        test: 'jest',
        build: 'webpack --mode production',
        dev: 'webpack-dev-server --mode development',
      },
      keywords: ['awesome', 'project', 'example'],
      author: 'Developer Name',
      license: 'MIT',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        axios: '^1.6.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        webpack: '^5.88.0',
        jest: '^29.5.0',
      },
    },
  },
  {
    id: 'geojson',
    name: 'GeoJSON Data',
    description: 'Sample GeoJSON with geographic features',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749],
          },
          properties: {
            name: 'San Francisco',
            population: 883305,
            state: 'California',
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-74.006, 40.7128],
          },
          properties: {
            name: 'New York City',
            population: 8336817,
            state: 'New York',
          },
        },
      ],
    },
  },
  {
    id: 'large-dataset',
    name: 'Large Dataset',
    description: 'Sample large dataset with multiple records',
    data: {
      products: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        category: ['Electronics', 'Clothing', 'Books', 'Home'][i % 4],
        price: Math.round(Math.random() * 1000 * 100) / 100,
        inStock: Math.random() > 0.3,
        rating: Math.round(Math.random() * 5 * 10) / 10,
        reviews: Math.floor(Math.random() * 500),
        tags: ['featured', 'popular', 'sale', 'new'].slice(
          0,
          Math.floor(Math.random() * 4) + 1
        ),
      })),
    },
  },
  {
    id: 'nested-object',
    name: 'Deeply Nested Object',
    description: 'Complex nested object structure',
    data: {
      company: {
        name: 'Tech Corp',
        founded: 2010,
        headquarters: {
          address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            country: 'USA',
            coordinates: {
              latitude: 37.7749,
              longitude: -122.4194,
            },
          },
        },
        departments: {
          engineering: {
            teams: {
              frontend: {
                lead: 'Alice Johnson',
                members: ['Bob', 'Charlie', 'Diana'],
                projects: ['Website Redesign', 'Mobile App'],
              },
              backend: {
                lead: 'Eve Williams',
                members: ['Frank', 'Grace', 'Henry'],
                projects: ['API v2', 'Database Migration'],
              },
            },
          },
          sales: {
            regions: {
              north: {
                manager: 'Ian Brown',
                revenue: 1250000,
              },
              south: {
                manager: 'Jane Davis',
                revenue: 980000,
              },
            },
          },
        },
      },
    },
  },
  {
    id: 'array-objects',
    name: 'Array of Objects',
    description: 'List of employees with detailed information',
    data: [
      {
        id: 'E001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        department: 'Engineering',
        position: 'Senior Developer',
        salary: 120000,
        joinDate: '2020-03-15',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        certifications: [
          { name: 'AWS Certified', year: 2021 },
          { name: 'React Advanced', year: 2022 },
        ],
      },
      {
        id: 'E002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        department: 'Design',
        position: 'UX Designer',
        salary: 95000,
        joinDate: '2021-07-01',
        skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research'],
        certifications: [{ name: 'UX Certification', year: 2020 }],
      },
      {
        id: 'E003',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@company.com',
        department: 'Marketing',
        position: 'Marketing Manager',
        salary: 110000,
        joinDate: '2019-11-20',
        skills: ['SEO', 'Content Marketing', 'Analytics', 'Social Media'],
        certifications: [
          { name: 'Google Analytics', year: 2019 },
          { name: 'HubSpot Inbound', year: 2020 },
        ],
      },
    ],
  },
];

export function getSampleById(id: string): Sample | undefined {
  return samples.find((sample) => sample.id === id);
}

export function getAllSamples(): Sample[] {
  return samples;
}
