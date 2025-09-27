'use client';

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface CommitTimelineProps {
  data: Array<{
    date: string;
    commits: number;
    authors: number;
  }>;
}

export function CommitTimeline({ data }: CommitTimelineProps) {
  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={60}
            stroke="#9ca3af"
          />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
          <Tooltip 
            labelFormatter={(label) => `Data: ${label}`}
            formatter={(value, name) => [value, name === 'commits' ? 'Commits' : 'Autores']}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="commits" 
            stroke="#3B82F6" 
            strokeWidth={3}
            name="Commits"
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="authors" 
            stroke="#10B981" 
            strokeWidth={3}
            name="Autores"
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AuthorActivityProps {
  data: Array<{
    name: string;
    commits: number;
    insertions: number;
    deletions: number;
  }>;
}

export function AuthorActivity({ data }: AuthorActivityProps) {
  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="#9ca3af"
          />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
          <Tooltip 
            formatter={(value, name) => {
              const labels: { [key: string]: string } = {
                commits: 'Commits',
                insertions: 'Inserções',
                deletions: 'Deleções'
              };
              return [value, labels[name] || name];
            }}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar dataKey="commits" fill="#3B82F6" name="Commits" radius={[2, 2, 0, 0]} />
          <Bar dataKey="insertions" fill="#10B981" name="Inserções" radius={[2, 2, 0, 0]} />
          <Bar dataKey="deletions" fill="#EF4444" name="Deleções" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ProductivityDistributionProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function ProductivityDistribution({ data }: ProductivityDistributionProps) {
  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [value, 'Commits']}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface HourlyActivityProps {
  data: Array<{
    hour: string;
    commits: number;
  }>;
}

export function HourlyActivity({ data }: HourlyActivityProps) {
  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            stroke="#9ca3af"
          />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
          <Tooltip 
            labelFormatter={(label) => `Hora: ${label}h`}
            formatter={(value) => [value, 'Commits']}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="commits" 
            fill="#8B5CF6" 
            name="Commits por Hora" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}