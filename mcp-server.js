#!/usr/bin/env node

/**
 * Supabase MCP Server
 * Model Context Protocol을 사용하여 Supabase 데이터베이스와 상호작용하는 서버
 */

import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Supabase 설정
const supabaseUrl = 'https://boorsqnfkwglzvnhtwcx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3JzcW5ma3dnbHp2bmh0d2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDE3NDEsImV4cCI6MjA3MjExNzc0MX0.eU0BSY8u1b-qcx3OTgvGIW-EQHotI4SwNuWAg0eqed0';

// Supabase 클라이언트 초기화
const supabase = createClient(supabaseUrl, supabaseKey);

// MCP 서버 생성
const server = new Server(
  {
    name: 'supabase-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 사용 가능한 도구 목록
const tools = [
  {
    name: 'get_apartments',
    description: '모든 아파트 목록을 조회합니다',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_applications',
    description: '신청서 목록을 조회합니다. 필터링 옵션을 제공합니다',
    inputSchema: {
      type: 'object',
      properties: {
        apartment_id: {
          type: 'string',
          description: '특정 아파트 ID로 필터링',
        },
        limit: {
          type: 'number',
          description: '결과 개수 제한 (기본값: 100)',
        },
      },
    },
  },
  {
    name: 'create_application',
    description: '새로운 신청서를 생성합니다',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '공사요청 동/호수',
        },
        phone: {
          type: 'string',
          description: '연락처',
        },
        workType: {
          type: 'string',
          description: '현재 사용 중인 인터넷 통신사',
        },
        start_date: {
          type: 'string',
          description: '공사 희망일 (YYYY-MM-DD 형식)',
        },
        description: {
          type: 'string',
          description: '상세 요청사항',
        },
      },
      required: ['name', 'phone', 'workType', 'start_date'],
    },
  },
  {
    name: 'update_apartment_settings',
    description: '아파트 설정을 업데이트합니다',
    inputSchema: {
      type: 'object',
      properties: {
        apartment_id: {
          type: 'string',
          description: '아파트 ID',
        },
        apartment_name: {
          type: 'string',
          description: '아파트 이름',
        },
        agency_name: {
          type: 'string',
          description: '대리점 이름',
        },
        agency_code: {
          type: 'string',
          description: '대리점 코드',
        },
        title: {
          type: 'string',
          description: '신청서 제목',
        },
        subtitle: {
          type: 'string',
          description: '신청서 부제목',
        },
        phones: {
          type: 'array',
          items: { type: 'string' },
          description: '전화번호 목록',
        },
        emails: {
          type: 'array',
          items: { type: 'string' },
          description: '이메일 목록',
        },
      },
      required: ['apartment_id'],
    },
  },
  {
    name: 'get_apartment_settings',
    description: '특정 아파트의 설정을 조회합니다',
    inputSchema: {
      type: 'object',
      properties: {
        apartment_id: {
          type: 'string',
          description: '아파트 ID',
        },
      },
      required: ['apartment_id'],
    },
  },
];

// 도구 목록 요청 처리
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 도구 호출 요청 처리
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_apartments':
        return await getApartments();

      case 'get_applications':
        return await getApplications(args);

      case 'create_application':
        return await createApplication(args);

      case 'update_apartment_settings':
        return await updateApartmentSettings(args);

      case 'get_apartment_settings':
        return await getApartmentSettings(args);

      default:
        throw new Error(`알 수 없는 도구: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `오류 발생: ${error.message}`,
        },
      ],
    };
  }
});

// 아파트 목록 조회
async function getApartments() {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('apartment_id, apartment_name, agency_name, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`아파트 목록 조회 실패: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `총 ${data.length}개의 아파트가 있습니다:\n\n${data
          .map(
            (apt) =>
              `• ${apt.apartment_name} (ID: ${apt.apartment_id})\n  대리점: ${apt.agency_name}\n  업데이트: ${new Date(apt.updated_at).toLocaleString()}`
          )
          .join('\n\n')}`,
      },
    ],
  };
}

// 신청서 목록 조회
async function getApplications(args = {}) {
  const { apartment_id, limit = 100 } = args;

  let query = supabase
    .from('applications')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (apartment_id) {
    // apartment_id로 필터링 (현재 applications 테이블에는 apartment_id가 없으므로 주석 처리)
    // query = query.eq('apartment_id', apartment_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`신청서 목록 조회 실패: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `총 ${data.length}개의 신청서가 있습니다:\n\n${data
          .map(
            (app) =>
              `• 신청번호: ${app.application_number}\n  이름: ${app.name}\n  연락처: ${app.phone}\n  주소: ${app.address}\n  통신사: ${app.workType_display}\n  예산: ${app.budget_display}\n  희망일: ${app.start_date}\n  제출일: ${new Date(app.submitted_at).toLocaleString()}`
          )
          .join('\n\n')}`,
      },
    ],
  };
}

// 신청서 생성
async function createApplication(args) {
  const { name, phone, workType, start_date, description = '' } = args;

  // 신청번호 생성 (타임스탬프 기반)
  const application_number = `APP${Date.now()}`;

  // workType 매핑
  const workTypeMapping = {
    interior: 'KT',
    exterior: 'SKT',
    plumbing: 'LGU+',
    electrical: '기타(지역방송)',
  };

  const workType_display = workTypeMapping[workType] || workType;

  const { data, error } = await supabase
    .from('applications')
    .insert([
      {
        application_number,
        name,
        phone,
        address: name, // 현재 구조상 주소는 name과 동일
        workType,
        workType_display,
        budget: '미정',
        budget_display: '미정',
        start_date,
        description,
      },
    ])
    .select();

  if (error) {
    throw new Error(`신청서 생성 실패: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `신청서가 성공적으로 생성되었습니다!\n\n신청번호: ${data[0].application_number}\n이름: ${data[0].name}\n연락처: ${data[0].phone}\n통신사: ${data[0].workType_display}\n희망일: ${data[0].start_date}`,
      },
    ],
  };
}

// 아파트 설정 업데이트
async function updateApartmentSettings(args) {
  const {
    apartment_id,
    apartment_name,
    agency_name,
    agency_code,
    title,
    subtitle,
    phones,
    emails,
  } = args;

  const updateData = {
    updated_at: new Date().toISOString(),
  };

  if (apartment_name) updateData.apartment_name = apartment_name;
  if (agency_name) updateData.agency_name = agency_name;
  if (agency_code) updateData.agency_code = agency_code;
  if (title) updateData.title = title;
  if (subtitle) updateData.subtitle = subtitle;
  if (phones) updateData.phones = phones;
  if (emails) updateData.emails = emails;

  const { data, error } = await supabase
    .from('admin_settings')
    .upsert(
      {
        apartment_id,
        ...updateData,
      },
      { onConflict: 'apartment_id' }
    )
    .select();

  if (error) {
    throw new Error(`아파트 설정 업데이트 실패: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `아파트 설정이 성공적으로 업데이트되었습니다!\n\n아파트 ID: ${apartment_id}\n아파트명: ${data[0].apartment_name}\n대리점: ${data[0].agency_name}`,
      },
    ],
  };
}

// 아파트 설정 조회
async function getApartmentSettings(args) {
  const { apartment_id } = args;

  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .eq('apartment_id', apartment_id)
    .single();

  if (error) {
    throw new Error(`아파트 설정 조회 실패: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `아파트 설정 정보:\n\n아파트 ID: ${data.apartment_id}\n아파트명: ${data.apartment_name}\n대리점명: ${data.agency_name}\n대리점 코드: ${data.agency_code}\n제목: ${data.title}\n부제목: ${data.subtitle}\n전화번호: ${data.phones?.join(', ') || '없음'}\n이메일: ${data.emails?.join(', ') || '없음'}\n생성일: ${new Date(data.created_at).toLocaleString()}\n업데이트: ${new Date(data.updated_at).toLocaleString()}`,
      },
    ],
  };
}

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Supabase MCP 서버가 시작되었습니다.');
}

main().catch((error) => {
  console.error('서버 시작 실패:', error);
  process.exit(1);
});
