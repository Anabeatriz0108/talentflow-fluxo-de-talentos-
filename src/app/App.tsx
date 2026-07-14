import { useState, useEffect, useRef, useCallback, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import {
  LayoutDashboard, Users, UserPlus, Award, Star, Target, Kanban,
  BookOpen, FileText, BarChart3, TrendingUp, GitBranch, Settings,
  Shield, Bell, MessageSquare, HelpCircle, Sun, Moon, Search,
  ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Filter, Download, Plus, Eye, Edit2, Trash2, Copy, History,
  CheckCircle2, Clock, AlertCircle, X, Menu, Briefcase, Mail, Phone,
  Calendar, LogOut, User, Building2, TrendingDown, Activity, Zap,
  RefreshCw, Upload, Camera, MapPin, Globe, Lock, EyeOff, Check,
  XCircle, RotateCcw, Printer, Share2, FileDown, ChevronUp, Minus,
  AlertTriangle, Info, MoreVertical, GripVertical, Tag, Layers,
  BarChart2, PieChart as PieChartIcon, List, Grid, Save, Ban,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Employee = {
  id: number; name: string; socialName: string; cpf: string; rg: string;
  birthDate: string; gender: string; maritalStatus: string; nationality: string;
  naturalness: string; email: string; phone: string; mobile: string;
  cep: string; address: string; city: string; state: string; country: string;
  matricula: string; role: string; dept: string; manager: string;
  costCenter: string; company: string; branch: string; contractType: string;
  workModel: string; salary: string; workHours: string; shift: string;
  admission: string; experienceDate: string; status: string; accessProfile: string;
  score: number; avatar: string; photo?: string; notes: string;
  benefits: Record<string, boolean>;
  competencies: { name: string; expected: number; current: number }[];
};

type Competency = { id: number; name: string; category: string; description: string; active: boolean };
type Evaluation = {
  id: number; title: string; type: string; status: string;
  period: string; employees: number[]; createdAt: string; deadline: string; answers: number;
};
type KanbanCard = {
  id: number; title: string; priority: string; assignee: string;
  tags: string[]; deadline: string; checklist: { text: string; done: boolean }[];
  description: string;
};
type KanbanColumn = { id: string; label: string; color: string; cards: KanbanCard[] };
type Certificate = { id: number; employee: string; course: string; issuedAt: string; expires: string; code: string };
type Notification = { id: number; text: string; time: string; read: boolean; type: string };
type AppSettings = { theme: string; language: string; notifications: boolean; emailNotif: boolean; smsNotif: boolean };
type AdminUser = { id: number; name: string; email: string; role: string; active: boolean; lastLogin: string };
type RecruitmentVacancy = {
  id: number;
  title: string;
  dept: string;
  candidates: number;
  status: string;
  priority: string;
  description: string;
  applicants: { id: number; name: string; stage: string; score: number }[];
};
type RecruitmentVacancySetter = (value: RecruitmentVacancy[] | ((prev: RecruitmentVacancy[]) => RecruitmentVacancy[])) => void;
type DashboardPeriod = "mensal" | "trimestral" | "anual";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPTS = ["Engenharia", "Produto", "Comercial", "RH", "Design", "Analytics", "Financeiro", "Operações", "Jurídico"];
const ROLES_BY_DEPT: Record<string, string[]> = {
  Engenharia: ["Engenheiro Júnior", "Engenheiro Pleno", "Engenheiro Sênior", "Tech Lead"],
  Produto: ["Product Manager", "Product Owner", "Head of Product"],
  Comercial: ["SDR", "Account Executive", "Sales Manager", "VP Comercial"],
  RH: ["Analista RH", "HRBP", "Gerente RH"],
  Design: ["UX Designer", "UI Designer", "Design Lead"],
  Analytics: ["Data Analyst", "Data Scientist", "Analytics Manager"],
  Financeiro: ["Analista Financeiro", "Controller", "CFO"],
  Operações: ["Analista de Operações", "Gerente de Operações"],
  Jurídico: ["Advogado", "Gerente Jurídico"],
};
const STATUSES = ["Ativo", "Férias", "Afastado", "Inativo"];
const WORK_MODELS = ["Presencial", "Híbrido", "Remoto"];
const CONTRACT_TYPES = ["CLT", "PJ", "Estágio", "Temporário"];
const STATES_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const ACCESS_PROFILES = ["Administrador", "Gestor", "Colaborador", "Leitura"];
const BENEFIT_KEYS = ["vt", "planoSaude", "planoDental", "vr", "va", "seguro", "previdencia"];
const BENEFIT_LABELS: Record<string, string> = {
  vt: "Vale Transporte", planoSaude: "Plano de Saúde", planoDental: "Plano Odontológico",
  vr: "Vale Refeição", va: "Vale Alimentação", seguro: "Seguro de Vida", previdencia: "Previdência Privada",
};
const DASHBOARD_PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];

function getPeriodLabel(period: DashboardPeriod) {
  return DASHBOARD_PERIODS.find(item => item.value === period)?.label || "Mensal";
}

function parseBrazilDate(value: string) {
  if (!value) return null;
  const [day, month, year] = value.split("/").map(part => Number(part));
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function getPeriodBucket(value: string, period: DashboardPeriod) {
  const date = parseBrazilDate(value);
  if (!date) return null;
  if (period === "mensal") return { year: date.getFullYear(), month: date.getMonth() };
  if (period === "trimestral") return { year: date.getFullYear(), quarter: Math.floor(date.getMonth() / 3) };
  return { year: date.getFullYear() };
}

function getMostRecentBucket(employees: Employee[], period: DashboardPeriod) {
  const buckets = employees.map(employee => getPeriodBucket(employee.admission, period)).filter(Boolean) as Array<Record<string, number>>;
  if (!buckets.length) return null;
  return buckets.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (period === "mensal") return (b.month ?? 0) - (a.month ?? 0);
    if (period === "trimestral") return (b.quarter ?? 0) - (a.quarter ?? 0);
    return 0;
  })[0];
}

function filterEmployeesByPeriod(employees: Employee[], period: DashboardPeriod) {
  const fallbackBucket = getMostRecentBucket(employees, period);
  return employees.filter(employee => {
    const bucket = getPeriodBucket(employee.admission, period);
    if (!bucket) return false;
    if (!fallbackBucket) return true;

    if (period === "mensal") {
      return bucket.year === fallbackBucket.year && bucket.month === fallbackBucket.month;
    }
    if (period === "trimestral") {
      return bucket.year === fallbackBucket.year && bucket.quarter === fallbackBucket.quarter;
    }
    return bucket.year === fallbackBucket.year;
  });
}

// ─── Initial Data ─────────────────────────────────────────────────────────────
const SEED_EMPLOYEES: Employee[] = [
  {
    id: 1, name: "Rafaela Mendonça", socialName: "", cpf: "123.456.789-01", rg: "12.345.678-9",
    birthDate: "1988-05-12", gender: "Feminino", maritalStatus: "Casada", nationality: "Brasileira", naturalness: "São Paulo",
    email: "rafaela@talentflow.com", phone: "+55 11 3456-7890", mobile: "+55 11 99234-5678",
    cep: "01310-100", address: "Av. Paulista, 1000", city: "São Paulo", state: "SP", country: "Brasil",
    matricula: "TF-0001", role: "Head of Product", dept: "Produto", manager: "Carlos Alves",
    costCenter: "CC-PRD", company: "TalentFlow S/A", branch: "Matriz SP", contractType: "CLT",
    workModel: "Híbrido", salary: "18500", workHours: "40h", shift: "Comercial",
    admission: "12/03/2021", experienceDate: "12/06/2021", status: "Ativo", accessProfile: "Gestor",
    score: 94, avatar: "RM", notes: "Alta performer, candidata à promoção em Q1.",
    benefits: { vt: false, planoSaude: true, planoDental: true, vr: true, va: false, seguro: true, previdencia: true },
    competencies: [{ name: "Liderança", expected: 90, current: 88 }, { name: "Comunicação", expected: 85, current: 82 }],
  },
  {
    id: 2, name: "Lucas Ferreira", socialName: "", cpf: "234.567.890-12", rg: "23.456.789-0",
    birthDate: "1992-08-22", gender: "Masculino", maritalStatus: "Solteiro", nationality: "Brasileira", naturalness: "Campinas",
    email: "lucas@talentflow.com", phone: "+55 11 3567-8901", mobile: "+55 11 98765-4321",
    cep: "13010-050", address: "Rua Barão de Jaguara, 500", city: "Campinas", state: "SP", country: "Brasil",
    matricula: "TF-0002", role: "Senior Engineer", dept: "Engenharia", manager: "Ana Costa",
    costCenter: "CC-ENG", company: "TalentFlow S/A", branch: "Matriz SP", contractType: "CLT",
    workModel: "Remoto", salary: "15000", workHours: "40h", shift: "Flexível",
    admission: "05/07/2020", experienceDate: "05/10/2020", status: "Ativo", accessProfile: "Colaborador",
    score: 88, avatar: "LF", notes: "",
    benefits: { vt: false, planoSaude: true, planoDental: true, vr: true, va: true, seguro: true, previdencia: false },
    competencies: [{ name: "Técnico", expected: 95, current: 90 }],
  },
  {
    id: 3, name: "Beatriz Santos", socialName: "", cpf: "345.678.901-23", rg: "34.567.890-1",
    birthDate: "1995-03-15", gender: "Feminino", maritalStatus: "Solteira", nationality: "Brasileira", naturalness: "Rio de Janeiro",
    email: "beatriz@talentflow.com", phone: "+55 21 3678-9012", mobile: "+55 11 97654-3210",
    cep: "01409-001", address: "Rua Augusta, 200", city: "São Paulo", state: "SP", country: "Brasil",
    matricula: "TF-0003", role: "UX Designer", dept: "Design", manager: "Rafaela Mendonça",
    costCenter: "CC-DSG", company: "TalentFlow S/A", branch: "Matriz SP", contractType: "CLT",
    workModel: "Híbrido", salary: "9500", workHours: "40h", shift: "Comercial",
    admission: "18/01/2022", experienceDate: "18/04/2022", status: "Ativo", accessProfile: "Colaborador",
    score: 91, avatar: "BS", notes: "",
    benefits: { vt: true, planoSaude: true, planoDental: false, vr: true, va: false, seguro: false, previdencia: false },
    competencies: [],
  },
  {
    id: 4, name: "Thiago Oliveira", socialName: "", cpf: "456.789.012-34", rg: "45.678.901-2",
    birthDate: "1990-11-30", gender: "Masculino", maritalStatus: "Casado", nationality: "Brasileira", naturalness: "Belo Horizonte",
    email: "thiago@talentflow.com", phone: "+55 31 3789-0123", mobile: "+55 21 98123-4567",
    cep: "30140-002", address: "Av. Afonso Pena, 1500", city: "Belo Horizonte", state: "MG", country: "Brasil",
    matricula: "TF-0004", role: "Data Scientist", dept: "Analytics", manager: "Pedro Lima",
    costCenter: "CC-ANL", company: "TalentFlow S/A", branch: "Filial BH", contractType: "CLT",
    workModel: "Remoto", salary: "14000", workHours: "40h", shift: "Flexível",
    admission: "03/11/2019", experienceDate: "03/02/2020", status: "Ativo", accessProfile: "Colaborador",
    score: 85, avatar: "TO", notes: "",
    benefits: { vt: false, planoSaude: true, planoDental: true, vr: true, va: true, seguro: true, previdencia: true },
    competencies: [],
  },
  {
    id: 5, name: "Camila Rodrigues", socialName: "", cpf: "567.890.123-45", rg: "56.789.012-3",
    birthDate: "1993-07-08", gender: "Feminino", maritalStatus: "Casada", nationality: "Brasileira", naturalness: "Curitiba",
    email: "camila@talentflow.com", phone: "+55 41 3890-1234", mobile: "+55 11 96543-2109",
    cep: "80010-010", address: "Rua XV de Novembro, 700", city: "Curitiba", state: "PR", country: "Brasil",
    matricula: "TF-0005", role: "HR Business Partner", dept: "RH", manager: "Ana Costa",
    costCenter: "CC-RH", company: "TalentFlow S/A", branch: "Filial CWB", contractType: "CLT",
    workModel: "Presencial", salary: "8500", workHours: "40h", shift: "Comercial",
    admission: "22/04/2021", experienceDate: "22/07/2021", status: "Férias", accessProfile: "Gestor",
    score: 79, avatar: "CR", notes: "Retorna de férias em 15/01/2025.",
    benefits: { vt: true, planoSaude: true, planoDental: true, vr: true, va: false, seguro: false, previdencia: false },
    competencies: [],
  },
  {
    id: 6, name: "Eduardo Nascimento", socialName: "", cpf: "678.901.234-56", rg: "67.890.123-4",
    birthDate: "1987-01-20", gender: "Masculino", maritalStatus: "Divorciado", nationality: "Brasileira", naturalness: "Porto Alegre",
    email: "eduardo@talentflow.com", phone: "+55 51 3901-2345", mobile: "+55 11 95432-1098",
    cep: "90010-160", address: "Av. Borges de Medeiros, 300", city: "Porto Alegre", state: "RS", country: "Brasil",
    matricula: "TF-0006", role: "Sales Manager", dept: "Comercial", manager: "Carlos Alves",
    costCenter: "CC-COM", company: "TalentFlow S/A", branch: "Filial POA", contractType: "CLT",
    workModel: "Híbrido", salary: "12000", workHours: "40h", shift: "Comercial",
    admission: "08/09/2020", experienceDate: "08/12/2020", status: "Ativo", accessProfile: "Gestor",
    score: 82, avatar: "EN", notes: "",
    benefits: { vt: false, planoSaude: true, planoDental: true, vr: true, va: true, seguro: true, previdencia: false },
    competencies: [],
  },
  {
    id: 7, name: "Isabela Costa", socialName: "", cpf: "789.012.345-67", rg: "78.901.234-5",
    birthDate: "1996-09-14", gender: "Feminino", maritalStatus: "Solteira", nationality: "Brasileira", naturalness: "Fortaleza",
    email: "isabela@talentflow.com", phone: "+55 85 3012-3456", mobile: "+55 11 94321-0987",
    cep: "60175-047", address: "Av. Santos Dumont, 2000", city: "Fortaleza", state: "CE", country: "Brasil",
    matricula: "TF-0007", role: "Finance Analyst", dept: "Financeiro", manager: "Pedro Lima",
    costCenter: "CC-FIN", company: "TalentFlow S/A", branch: "Filial FOR", contractType: "CLT",
    workModel: "Presencial", salary: "7500", workHours: "40h", shift: "Comercial",
    admission: "14/02/2023", experienceDate: "14/05/2023", status: "Ativo", accessProfile: "Colaborador",
    score: 76, avatar: "IC", notes: "",
    benefits: { vt: true, planoSaude: true, planoDental: false, vr: true, va: false, seguro: false, previdencia: false },
    competencies: [],
  },
  {
    id: 8, name: "Gabriel Martins", socialName: "", cpf: "890.123.456-78", rg: "89.012.345-6",
    birthDate: "1991-04-03", gender: "Masculino", maritalStatus: "Casado", nationality: "Brasileira", naturalness: "Recife",
    email: "gabriel@talentflow.com", phone: "+55 81 3123-4567", mobile: "+55 21 93210-9876",
    cep: "50010-000", address: "Av. Dantas Barreto, 900", city: "Recife", state: "PE", country: "Brasil",
    matricula: "TF-0008", role: "DevOps Engineer", dept: "Engenharia", manager: "Lucas Ferreira",
    costCenter: "CC-ENG", company: "TalentFlow S/A", branch: "Filial REC", contractType: "CLT",
    workModel: "Remoto", salary: "13000", workHours: "40h", shift: "Flexível",
    admission: "27/06/2022", experienceDate: "27/09/2022", status: "Afastado", accessProfile: "Colaborador",
    score: 88, avatar: "GM", notes: "Afastamento médico até 20/01/2025.",
    benefits: { vt: false, planoSaude: true, planoDental: true, vr: false, va: false, seguro: true, previdencia: true },
    competencies: [],
  },
];

const SEED_COMPETENCIES: Competency[] = [
  { id: 1, name: "Liderança", category: "Comportamental", description: "Capacidade de inspirar e guiar equipes", active: true },
  { id: 2, name: "Comunicação", category: "Comportamental", description: "Habilidade de transmitir ideias com clareza", active: true },
  { id: 3, name: "Pensamento Analítico", category: "Cognitiva", description: "Análise crítica de dados e situações", active: true },
  { id: 4, name: "Inovação", category: "Cognitiva", description: "Propor soluções criativas e disruptivas", active: true },
  { id: 5, name: "Colaboração", category: "Comportamental", description: "Trabalho em equipe e cooperação", active: true },
  { id: 6, name: "Orientação a Resultados", category: "Atitudinal", description: "Foco em entregas e superação de metas", active: true },
  { id: 7, name: "Gestão de Projetos", category: "Técnica", description: "Planejamento e controle de projetos", active: true },
  { id: 8, name: "Visão Estratégica", category: "Cognitiva", description: "Capacidade de planejamento de longo prazo", active: false },
];

const SEED_EVALUATIONS: Evaluation[] = [
  { id: 1, title: "Ciclo Avaliativo Q4 2024 — 360°", type: "360°", status: "Encerrado", period: "Out–Dez 2024", employees: [1, 2, 3, 4], createdAt: "01/10/2024", deadline: "31/12/2024", answers: 4 },
  { id: 2, title: "Autoavaliação Anual 2024", type: "Autoavaliação", status: "Publicado", period: "Jan 2025", employees: [1, 2, 3, 4, 5, 6, 7, 8], createdAt: "02/01/2025", deadline: "15/01/2025", answers: 3 },
  { id: 3, title: "Avaliação 180° — Gestores Q1", type: "180°", status: "Rascunho", period: "Jan–Mar 2025", employees: [1, 6], createdAt: "03/01/2025", deadline: "31/03/2025", answers: 0 },
];

const SEED_KANBAN: KanbanColumn[] = [
  {
    id: "backlog", label: "Backlog", color: "#64748B",
    cards: [
      { id: 1, title: "Implementar módulo de 360°", priority: "Alta", assignee: "LF", tags: ["Avaliação"], deadline: "30 Jan", description: "Desenvolver o ciclo completo de avaliação 360°.", checklist: [{ text: "Definir questionário", done: false }, { text: "Mapear avaliadores", done: false }] },
      { id: 2, title: "Revisão política de benefícios", priority: "Média", assignee: "CR", tags: ["RH"], deadline: "15 Fev", description: "", checklist: [] },
    ],
  },
  {
    id: "todo", label: "A Fazer", color: "#D97706",
    cards: [
      { id: 3, title: "Configurar integração com Slack", priority: "Alta", assignee: "GM", tags: ["TI"], deadline: "12 Jan", description: "Integrar notificações do TalentFlow ao Slack.", checklist: [{ text: "Criar App no Slack", done: true }, { text: "Configurar webhooks", done: false }] },
      { id: 4, title: "Plano de desenvolvimento Q1", priority: "Alta", assignee: "RM", tags: ["Metas"], deadline: "10 Jan", description: "", checklist: [] },
    ],
  },
  {
    id: "doing", label: "Em Andamento", color: "#2563EB",
    cards: [
      { id: 5, title: "Onboarding novos engenheiros", priority: "Urgente", assignee: "BS", tags: ["RH", "Engenharia"], deadline: "08 Jan", description: "", checklist: [{ text: "Preparar materiais", done: true }, { text: "Agendar reuniões", done: true }, { text: "Configurar acessos", done: false }] },
      { id: 6, title: "Dashboard Analytics v2", priority: "Alta", assignee: "TO", tags: ["Analytics"], deadline: "20 Jan", description: "", checklist: [] },
      { id: 7, title: "Revisão de cargos e salários", priority: "Média", assignee: "CR", tags: ["RH"], deadline: "25 Jan", description: "", checklist: [] },
    ],
  },
  {
    id: "review", label: "Revisão", color: "#8B5CF6",
    cards: [
      { id: 8, title: "Relatório turnover Q4 2024", priority: "Alta", assignee: "IC", tags: ["Relatório"], deadline: "05 Jan", description: "", checklist: [] },
    ],
  },
  {
    id: "done", label: "Concluído", color: "#16A34A",
    cards: [
      { id: 9, title: "Ciclo de avaliação Dez/2024", priority: "Alta", assignee: "RM", tags: ["Avaliação"], deadline: "31 Dez", description: "", checklist: [] },
      { id: 10, title: "Atualização manual de conduta", priority: "Baixa", assignee: "CR", tags: ["Compliance"], deadline: "28 Dez", description: "", checklist: [] },
    ],
  },
];

const SEED_CERTIFICATES: Certificate[] = [
  { id: 1, employee: "Beatriz Santos", course: "Design Systems Fundamentals", issuedAt: "15/12/2024", expires: "15/12/2025", code: "TF-CERT-0001" },
  { id: 2, employee: "Lucas Ferreira", course: "AWS Solutions Architect", issuedAt: "10/11/2024", expires: "10/11/2026", code: "TF-CERT-0002" },
  { id: 3, employee: "Rafaela Mendonça", course: "Product Leadership Certification", issuedAt: "05/10/2024", expires: "05/10/2026", code: "TF-CERT-0003" },
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 1, text: "Rafaela Mendonça concluiu avaliação 360°", time: "2 min atrás", read: false, type: "success" },
  { id: 2, text: "3 contratos de experiência vencem esta semana", time: "14 min atrás", read: false, type: "warning" },
  { id: 3, text: "Nova vaga: Engenheiro Backend Sênior", time: "1h atrás", read: false, type: "info" },
  { id: 4, text: "Beatriz Santos completou certificação", time: "2h atrás", read: true, type: "success" },
  { id: 5, text: "Relatório mensal disponível para download", time: "5h atrás", read: true, type: "info" },
];

const SEED_ADMIN_USERS: AdminUser[] = [
  { id: 1, name: "Carlos Alves", email: "carlos@talentflow.com", role: "Administrador", active: true, lastLogin: "Hoje, 09:12" },
  { id: 2, name: "Ana Costa", email: "ana@talentflow.com", role: "Gestor", active: true, lastLogin: "Hoje, 08:44" },
  { id: 3, name: "Pedro Lima", email: "pedro@talentflow.com", role: "Gestor", active: true, lastLogin: "Ontem, 17:30" },
  { id: 4, name: "Maria Silva", email: "maria@talentflow.com", role: "Colaborador", active: false, lastLogin: "Há 7 dias" },
];

const perf = [
  { month: "Jan", v: 72 }, { month: "Fev", v: 75 }, { month: "Mar", v: 78 },
  { month: "Abr", v: 74 }, { month: "Mai", v: 82 }, { month: "Jun", v: 86 },
  { month: "Jul", v: 84 }, { month: "Ago", v: 89 }, { month: "Set", v: 87 },
  { month: "Out", v: 91 }, { month: "Nov", v: 93 }, { month: "Dez", v: 90 },
];
const deptData = [
  { dept: "Engenharia", count: 48 }, { dept: "Produto", count: 22 },
  { dept: "Comercial", count: 35 }, { dept: "RH", count: 14 },
  { dept: "Design", count: 18 }, { dept: "Analytics", count: 20 },
];
const pieData = [
  { name: "Sênior", value: 38, color: "#2563EB" }, { name: "Pleno", value: 42, color: "#0EA5E9" },
  { name: "Júnior", value: 14, color: "#93C5FD" }, { name: "Gestão", value: 6, color: "#1D4ED8" },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: null },
  { id: "employees", label: "Colaboradores", icon: Users, section: "Pessoas" },
  { id: "recruitment", label: "Recrutamento", icon: UserPlus, section: "Pessoas" },
  { id: "competencies", label: "Competências", icon: Award, section: "Desenvolvimento" },
  { id: "evaluations", label: "Avaliações", icon: Star, section: "Desenvolvimento" },
  { id: "goals", label: "Metas", icon: Target, section: "Desenvolvimento" },
  { id: "kanban", label: "Kanban", icon: Kanban, section: "Projetos" },
  { id: "training", label: "Treinamentos", icon: BookOpen, section: "Aprendizado" },
  { id: "certificates", label: "Certificados", icon: FileText, section: "Aprendizado" },
  { id: "reports", label: "Relatórios", icon: BarChart3, section: "Inteligência" },
  { id: "analytics", label: "Analytics", icon: TrendingUp, section: "Inteligência" },
  { id: "orgchart", label: "Organograma", icon: GitBranch, section: "Inteligência" },
  { id: "settings", label: "Configurações", icon: Settings, section: "Sistema" },
  { id: "admin", label: "Administração", icon: Shield, section: "Sistema" },
];

const INITIAL_RECRUITMENT_VACANCIES: RecruitmentVacancy[] = [
  {
    id: 1,
    title: "Engenheiro Backend Sênior",
    dept: "Engenharia",
    candidates: 3,
    status: "Aberta",
    priority: "Alta",
    description: "Desenvolvimento de APIs escaláveis e arquitetura de microsserviços.",
    applicants: [
      { id: 1, name: "Ana Souza", stage: "Entrevista", score: 91 },
      { id: 2, name: "Bruno Lima", stage: "Triagem", score: 84 },
      { id: 3, name: "Carla Mendes", stage: "Entrevista", score: 88 },
    ],
  },
  {
    id: 2,
    title: "Product Manager",
    dept: "Produto",
    candidates: 2,
    status: "Aberta",
    priority: "Média",
    description: "Acompanhamento de roadmap e priorização de entregas com times de produto e engenharia.",
    applicants: [
      { id: 4, name: "Davi Rocha", stage: "Entrevista", score: 87 },
      { id: 5, name: "Elisa Tavares", stage: "Triagem", score: 82 },
    ],
  },
  {
    id: 3,
    title: "Data Analyst",
    dept: "Analytics",
    candidates: 1,
    status: "Em Entrevista",
    priority: "Alta",
    description: "Análise de métricas e automação de relatórios para negócios.",
    applicants: [
      { id: 6, name: "Fernanda Cruz", stage: "Entrevista", score: 90 },
    ],
  },
  {
    id: 4,
    title: "UX Researcher",
    dept: "Design",
    candidates: 1,
    status: "Proposta",
    priority: "Baixa",
    description: "Pesquisa com usuários e validação de experiência.",
    applicants: [
      { id: 7, name: "Guilherme Nunes", stage: "Proposta", score: 86 },
    ],
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setVal(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, set];
}

function nextId(arr: { id: number }[]) { return arr.length ? Math.max(...arr.map(i => i.id)) + 1 : 1; }

function initials(name: string) {
  const p = name.split(" "); return (p[0]?.[0] || "") + (p[p.length - 1]?.[0] || "");
}

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})/, "$1-$2");
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}
function maskCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}
function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validateCPF(c: string) { return c.replace(/\D/g, "").length === 11; }

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) { toast.error("Sem dados para exportar"); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => String(r[h] ?? "").replace(/,/g, ";")).join(","));
  const csv = "﻿" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} exportado com sucesso`);
}

async function lookupCEP(cep: string): Promise<Partial<Employee> | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  await new Promise(r => setTimeout(r, 600));
  const fakes: Record<string, Partial<Employee>> = {
    "01310100": { address: "Av. Paulista, 1000", city: "São Paulo", state: "SP" },
    "20040020": { address: "Av. Rio Branco, 156", city: "Rio de Janeiro", state: "RJ" },
    "30140002": { address: "Av. Afonso Pena, 1500", city: "Belo Horizonte", state: "MG" },
    "80010010": { address: "Rua XV de Novembro, 700", city: "Curitiba", state: "PR" },
    "90010160": { address: "Av. Borges de Medeiros, 300", city: "Porto Alegre", state: "RS" },
  };
  return fakes[clean] || { address: "Rua das Flores, 100", city: "São Paulo", state: "SP" };
}

// ─── Helper Components ────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#2563EB","#16A34A","#D97706","#DC2626","#0EA5E9","#8B5CF6","#DB2777","#0F766E"];
function AvatarEl({ name, size = "md", photo }: { name: string; size?: "xs"|"sm"|"md"|"lg"|"xl"; photo?: string }) {
  const bg = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const cls = { xs: "w-6 h-6 text-[9px]", sm: "w-8 h-8 text-xs", md: "w-9 h-9 text-xs", lg: "w-11 h-11 text-sm", xl: "w-16 h-16 text-xl" }[size];
  const init = initials(name).toUpperCase();
  if (photo) return <img src={photo} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />;
  return <div className={`${cls} rounded-full flex items-center justify-center font-semibold text-white shrink-0`} style={{ background: bg }}>{init}</div>;
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) {
  const cls: Record<string, string> = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    error: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    primary: "bg-blue-50 text-blue-700 border border-blue-200",
    purple: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    gray: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm ${cls[variant] || cls.default}`}>{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const v: Record<string, string> = { Ativo: "success", Férias: "info", Afastado: "warning", Inativo: "error" };
  return <Badge variant={v[status] || "default"}>{status}</Badge>;
}

function PriorityBadge({ p }: { p: string }) {
  const v: Record<string, string> = { Urgente: "error", Alta: "warning", Média: "primary", Baixa: "gray" };
  return <Badge variant={v[p] || "default"}>{p}</Badge>;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data), r = max - min || 1;
  const w = 60, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`);
  return <svg width={w} height={h}><polyline points={pts.join(" ")} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Spinner() { return <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />; }

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "danger" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
  children: ReactNode;
};

function Button({ children, variant = "primary", size = "md", iconOnly = false, className = "", ...props }: ButtonProps) {
  const variants = {
    primary: "border border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:border-blue-700 active:bg-blue-800",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100",
    outline: "border border-slate-300 bg-transparent text-slate-700 hover:bg-white hover:border-slate-400 active:bg-slate-100",
    danger: "border border-red-600 bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 active:bg-red-800",
    destructive: "border border-red-600 bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 active:bg-red-800",
    ghost: "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 shadow-none",
  };
  const sizes = {
    sm: "h-8 px-3 py-1.5 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-11 px-5 py-2.5 text-sm",
  };

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${iconOnly ? "h-9 w-9 p-0" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function notifySuccess(message: string) { toast.success(message); }
function notifyError(message: string) { toast.error(message); }
function notifyAlert(message: string) { toast.warning(message); }

function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirmar", danger = false }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
  confirmLabel?: string; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm animate-soft-in" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          {danger ? <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" /> : <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />}
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="md" onClick={onCancel}>Cancelar</Button>
          <Button variant={danger ? "destructive" : "primary"} size="md" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm animate-soft-in" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action, onAction }: { icon: any; title: string; desc: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-4 max-w-xs">{desc}</p>
      {action && onAction && (
        <Button onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} /></td>
      ))}
    </tr>
  );
}

function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 ${className}`}>
      <div className="h-10 w-10 rounded-lg bg-slate-200 mb-3" />
      <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-full bg-slate-200 rounded mb-2" />
      <div className="h-3 w-1/2 bg-slate-200 rounded" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-5">
          <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-48 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-36 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: { name: string; role: string; email: string }) => void }) {
  const [email, setEmail] = useState("admin@talentflow.com");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accounts = [
    { email: "admin@talentflow.com", password: "admin123", name: "Carlos Alves", role: "CEO" },
    { email: "rh@talentflow.com", password: "rh123", name: "Camila Rodrigues", role: "HRBP" },
  ];

  function validate() {
    const e: Record<string, string> = {};
    if (!email) e.email = "E-mail obrigatório";
    else if (!validateEmail(email)) e.email = "E-mail inválido";
    if (!password) e.password = "Senha obrigatória";
    else if (password.length < 3) e.password = "Senha muito curta";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const acc = accounts.find(a => a.email === email && a.password === password);
    setLoading(false);
    if (acc) {
      toast.success(`Bem-vindo, ${acc.name}!`);
      onLogin({ name: acc.name, role: acc.role, email: acc.email });
    } else {
      setErrors({ password: "E-mail ou senha incorretos" });
      toast.error("Credenciais inválidas");
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) { toast.error("Informe um e-mail válido"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setForgotSent(true);
    toast.success("Link de recuperação enviado para " + forgotEmail);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#2563EB" }}>
            <span className="text-white font-bold text-lg">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TalentFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Plataforma de Gestão de Talentos</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          {!forgot ? (
            <>
              <h2 className="text-base font-semibold text-slate-900 mb-5">Entrar na plataforma</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail corporativo</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@empresa.com"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${errors.email ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${errors.password ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70" style={{ background: "#2563EB" }}>
                  {loading ? <Spinner /> : null}
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
              <div className="text-center mt-4">
                <button onClick={() => { setForgot(true); setForgotSent(false); setForgotEmail(email); }} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Esqueci minha senha
                </button>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">Acesso rápido:</p>
                <div className="flex gap-2 mt-2">
                  {accounts.map(a => (
                    <button key={a.email} onClick={() => { setEmail(a.email); setPassword(a.password); }} className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                      {a.role}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setForgot(false)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-4 transition-colors">
                <ChevronRight size={13} className="rotate-180" /> Voltar
              </button>
              <h2 className="text-base font-semibold text-slate-900 mb-1">Recuperar senha</h2>
              <p className="text-xs text-slate-500 mb-5">Enviaremos um link de redefinição para seu e-mail.</p>
              {forgotSent ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 size={36} className="text-green-500" />
                  <p className="text-sm text-slate-700 text-center">Link enviado para <strong>{forgotEmail}</strong></p>
                  <button onClick={() => setForgot(false)} className="text-xs text-blue-600 hover:underline mt-2">Voltar ao login</button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail corporativo</label>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="seu@empresa.com" className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-2.5 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-2" style={{ background: "#2563EB" }}>
                    {loading ? <Spinner /> : null} {loading ? "Enviando..." : "Enviar link"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">TalentFlow v2.0 · Enterprise HR Platform</p>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const SECTIONS = ["Pessoas", "Desenvolvimento", "Projetos", "Aprendizado", "Inteligência", "Sistema"];
function PremiumLoginScreen({ onLogin }: { onLogin: (user: { name: string; role: string; email: string }) => void }) {
  const [email, setEmail] = useState("admin@talentflow.com");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accounts = [
    { email: "admin@talentflow.com", password: "admin123", name: "Carlos Alves", role: "CEO" },
    { email: "rh@talentflow.com", password: "rh123", name: "Camila Rodrigues", role: "HRBP" },
  ];

  function validate() {
    const e: Record<string, string> = {};
    if (!email) e.email = "E-mail obrigatorio";
    else if (!validateEmail(email)) e.email = "E-mail invalido";
    if (!password) e.password = "Senha obrigatoria";
    else if (password.length < 3) e.password = "Senha muito curta";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const acc = accounts.find(a => a.email === email && a.password === password);
    setLoading(false);
    if (acc) {
      toast.success(`Bem-vindo, ${acc.name}!`);
      onLogin({ name: acc.name, role: acc.role, email: acc.email });
    } else {
      setErrors({ password: "E-mail ou senha incorretos" });
      toast.error("Credenciais invalidas");
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) { toast.error("Informe um e-mail valido"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setForgotSent(true);
    toast.success("Link de recuperacao enviado para " + forgotEmail);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.10),transparent_28rem),radial-gradient(circle_at_80%_90%,rgba(34,197,94,0.08),transparent_24rem)]" />
          <div className="relative w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
                  <span className="text-sm font-bold text-white">TF</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-950">TalentFlow</h1>
                  <p className="text-xs font-medium text-slate-500">Enterprise ATS & People Ops</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                <Shield size={13} /> Acesso corporativo seguro
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Gestao de talentos com clareza executiva.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Entre para acompanhar colaboradores, recrutamento, avaliacoes, metas e indicadores de RH em uma experiencia integrada.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur">
              {!forgot ? (
                <>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-950">Entrar na plataforma</h2>
                      <p className="mt-1 text-xs text-slate-500">Use seu e-mail corporativo para continuar.</p>
                    </div>
                    <Badge variant="success">Online</Badge>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">E-mail corporativo</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@empresa.com" className={`h-11 w-full rounded-lg border px-3 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${errors.email ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}`} />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Senha</label>
                      <div className="relative">
                        <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="********" className={`h-11 w-full rounded-lg border px-3 pr-10 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${errors.password ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}`} />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600">
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>
                    <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.99] disabled:opacity-70">
                      {loading ? <Spinner /> : null}
                      {loading ? "Entrando..." : "Entrar"}
                    </button>
                  </form>
                  <div className="mt-4 text-center">
                    <button onClick={() => { setForgot(true); setForgotSent(false); setForgotEmail(email); }} className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700">Esqueci minha senha</button>
                  </div>
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-center text-xs font-medium text-slate-500">Acesso rapido</p>
                    <div className="mt-2 flex gap-2">
                      {accounts.map(a => (
                        <button key={a.email} onClick={() => { setEmail(a.email); setPassword(a.password); }} className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">{a.role}</button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setForgot(false)} className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-700"><ChevronRight size={13} className="rotate-180" /> Voltar</button>
                  <h2 className="mb-1 text-base font-bold text-slate-950">Recuperar senha</h2>
                  <p className="mb-5 text-xs text-slate-500">Enviaremos um link de redefinicao para seu e-mail.</p>
                  {forgotSent ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 py-6">
                      <CheckCircle2 size={36} className="text-emerald-500" />
                      <p className="text-center text-sm text-slate-700">Link enviado para <strong>{forgotEmail}</strong></p>
                      <button onClick={() => setForgot(false)} className="mt-2 text-xs text-blue-600 hover:underline">Voltar ao login</button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgot} className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">E-mail corporativo</label>
                        <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="seu@empresa.com" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10" />
                      </div>
                      <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:opacity-70">{loading ? <Spinner /> : null} {loading ? "Enviando..." : "Enviar link"}</button>
                    </form>
                  )}
                </>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-slate-400">TalentFlow v2.0 - Enterprise HR Platform</p>
          </div>
        </section>

        <section className="hidden items-center justify-center border-l border-slate-200 bg-slate-950 p-8 lg:flex">
          <div className="w-full max-w-xl">
            <div className="mb-6 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">People analytics</p>
                <h2 className="mt-2 text-2xl font-bold">Visao consolidada do time</h2>
              </div>
              <Badge variant="primary">Q3</Badge>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Headcount", value: "248", icon: Users, tone: "bg-blue-500/15 text-blue-200" },
                  { label: "Vagas abertas", value: "18", icon: Briefcase, tone: "bg-emerald-500/15 text-emerald-200" },
                  { label: "Performance", value: "91%", icon: Star, tone: "bg-amber-500/15 text-amber-200" },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${item.tone}`}><item.icon size={17} /></div>
                    <div className="text-2xl font-bold text-white">{item.value}</div>
                    <div className="mt-1 text-[11px] font-medium text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/80 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Pipeline de recrutamento</span>
                  <span className="text-xs text-slate-400">Atualizado agora</span>
                </div>
                {[
                  { stage: "Triagem", value: 82, color: "#60A5FA" },
                  { stage: "Entrevista", value: 58, color: "#22C55E" },
                  { stage: "Proposta", value: 36, color: "#F59E0B" },
                ].map(row => (
                  <div key={row.stage} className="mb-3 last:mb-0">
                    <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium text-slate-300">{row.stage}</span><span className="text-slate-500">{row.value}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${row.value}%`, background: row.color }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {["Avaliacoes 360", "Metas ativas", "Treinamentos", "Organograma"].map((item, i) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><Lock size={13} /> Dados protegidos por sessao local e controle de acesso.</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive, collapsed, setCollapsed, user, onLogout }: {
  active: string; setActive: (v: string) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  user: { name: string; role: string };
  onLogout: () => void;
}) {
  return (
    <aside className="flex h-full shrink-0 flex-col transition-all duration-300" style={{ width: collapsed ? 72 : 280, background: "linear-gradient(180deg, #0B1220 0%, #111827 100%)", borderRight: "1px solid rgba(148, 163, 184, 0.18)" }}>
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-blue-600 shadow-lg shadow-blue-950/30">
          <span className="text-sm font-bold text-white">TF</span>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="truncate text-sm font-bold text-white">TalentFlow</div>
            <div className="truncate text-[11px] font-medium text-slate-400">Enterprise ATS & People Ops</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><Menu size={16} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        {navItems.filter(i => !i.section).map(item => <NavBtn key={item.id} item={item} active={active} setActive={setActive} collapsed={collapsed} />)}
        {SECTIONS.map(sec => {
          const items = navItems.filter(i => i.section === sec);
          if (!items.length) return null;
          return (
            <div key={sec} className="mt-5">
              {!collapsed && <div className="mb-2 px-2"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{sec}</span></div>}
              {collapsed && <div className="mx-2 mb-2 border-t border-white/10" />}
              {items.map(item => <NavBtn key={item.id} item={item} active={active} setActive={setActive} collapsed={collapsed} />)}
            </div>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Plano Enterprise</span>
              <Badge variant="primary">Ativo</Badge>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-blue-500" />
            </div>
          </div>
        )}
        <button onClick={() => setActive("settings")} className={`mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white ${collapsed ? "justify-center" : ""}`}>
          <Settings size={16} />
          {!collapsed && <span className="font-medium">Configurações</span>}
        </button>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
          <AvatarEl name={user.name} size="sm" />
          {!collapsed && <div className="min-w-0 flex-1 overflow-hidden"><div className="truncate text-xs font-semibold text-white">{user.name}</div><div className="truncate text-[11px] text-slate-400">{user.role}</div></div>}
          {!collapsed && <button onClick={onLogout} title="Sair" className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300"><LogOut size={15} /></button>}
        </div>
      </div>
    </aside>
  );
}

function NavBtn({ item, active, setActive, collapsed }: { item: typeof navItems[0]; active: string; setActive: (v: string) => void; collapsed: boolean }) {
  const isActive = active === item.id;
  const Icon = item.icon;
  return (
    <button onClick={() => setActive(item.id)} title={collapsed ? item.label : undefined}
      className={`relative mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${collapsed ? "justify-center" : ""} ${isActive ? "bg-white text-slate-950 shadow-lg shadow-slate-950/20" : "text-slate-400 hover:bg-white/10 hover:text-slate-100"}`}
    >
      {isActive && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-blue-500" />}
      <Icon size={17} className={`shrink-0 ${isActive ? "text-blue-600" : ""}`} />
      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
    </button>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ active, dark, setDark, notifications, setNotifications, setActive, user, onLogout }: {
  active: string; dark: boolean; setDark: (v: boolean) => void;
  notifications: Notification[]; setNotifications: (n: Notification[]) => void;
  setActive: (v: string) => void; user: { name: string; role: string; email: string };
  onLogout: () => void;
}) {
  const label = navItems.find(i => i.id === active)?.label || "Dashboard";
  const [search, setSearch] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  const searchRef = useRef<HTMLDivElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function markAllRead() { setNotifications(notifications.map(n => ({ ...n, read: true }))); toast.success("Todas notificações marcadas como lidas"); }
  function clearNotifs() { setNotifications([]); toast.success("Notificações limpas"); }

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    toast.success(next ? "Tema escuro ativado" : "Tema claro ativado");
  }

  const searchResults = search.length > 1 ? [
    ...SEED_EMPLOYEES.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 3).map(e => ({ label: e.name, sub: e.role, action: "employees", type: "person" })),
    ...navItems.filter(n => n.label.toLowerCase().includes(search.toLowerCase())).slice(0, 2).map(n => ({ label: n.label, sub: "Página", action: n.id, type: "page" })),
  ] : [];

  return (
    <header className="relative z-30 flex h-[72px] shrink-0 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 shadow-sm backdrop-blur-xl sm:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="hidden text-slate-400 sm:inline">TalentFlow</span>
          <ChevronRight size={13} className="hidden sm:block" />
          <span className="truncate font-semibold text-slate-700">{label}</span>
        </div>
        <div className="mt-0.5 hidden text-[11px] text-slate-400 lg:block capitalize">{today}</div>
      </div>
      <div className="flex-1" />

      {/* Search */}
      <div ref={searchRef} className="relative hidden min-w-[240px] md:block">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
          onFocus={() => setShowSearch(true)}
          placeholder="Buscar pessoas, vagas, relatórios..."
          className="h-10 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm transition-all focus:w-96 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-soft-in">
            {searchResults.map((r, i) => (
              <button key={i} onClick={() => { setActive(r.action); setSearch(""); setShowSearch(false); }}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  {r.type === "person" ? <User size={15} className="text-blue-600" /> : <Layers size={15} className="text-slate-500" />}
                </span>
                <div><div className="text-sm font-semibold text-slate-800">{r.label}</div><div className="text-xs text-slate-400">{r.sub}</div></div>
              </button>
            ))}
          </div>
        )}
        {showSearch && search.length > 1 && searchResults.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-400 shadow-2xl animate-soft-in">Sem resultados para "{search}"</div>
        )}
      </div>

      <button onClick={() => setShowSearch(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 md:hidden">
        <Search size={16} />
      </button>

      <div className="hidden h-6 w-px bg-slate-200 sm:block" />

      {/* Notifications */}
      <div ref={notifsRef} className="relative">
        <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <Bell size={17} />
          {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">{unread}</span>}
        </button>
        {showNotifs && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-soft-in">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Notificações</span>
              <div className="flex gap-2">
                <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-700">Marcar todas</button>
                <button onClick={clearNotifs} className="text-xs font-medium text-slate-400 hover:text-slate-600">Limpar</button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Nenhuma notificação</div>
              ) : notifications.map(n => (
                <div key={n.id} onClick={() => setNotifications(notifications.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  className={`flex cursor-pointer items-start gap-3 border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50 ${!n.read ? "bg-blue-50/50" : ""}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-blue-500" : "bg-transparent"}`} />
                  <div className="flex-1"><p className="text-xs text-slate-700">{n.text}</p><p className="mt-0.5 text-[11px] text-slate-400">{n.time}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => { setActive("reports"); toast.info("Abrindo mensagens..."); }}
        className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:flex">
        <MessageSquare size={17} />
      </button>

      <button onClick={() => setShowHelp(true)} className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:flex">
        <HelpCircle size={17} />
      </button>

      <button onClick={toggleDark} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
        {dark ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Profile */}
      <div ref={profileRef} className="relative">
        <button onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-2 pr-2.5 shadow-sm transition-colors hover:bg-slate-50">
          <AvatarEl name={user.name} size="sm" />
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-slate-800">{user.name}</div>
            <div className="text-[11px] text-slate-400">{user.role}</div>
          </div>
          <ChevronDown size={13} className="text-slate-400" />
        </button>
        {showProfile && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-soft-in">
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            {[
              { label: "Meu Perfil", icon: User, action: () => { setActive("employees"); setShowProfile(false); } },
              { label: "Configurações", icon: Settings, action: () => { setActive("settings"); setShowProfile(false); } },
              { label: "Administração", icon: Shield, action: () => { setActive("admin"); setShowProfile(false); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                <item.icon size={14} />{item.label}
              </button>
            ))}
            <div className="border-t border-slate-100">
              <button onClick={onLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">
                <LogOut size={14} />Sair da conta
              </button>
            </div>
          </div>
        )}
      </div>
{/* Legacy navbar body retained below for diff stability */}
{false && <>
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <span className="text-slate-300">TalentFlow</span>
        <ChevronRight size={14} />
        <span className="text-slate-700 font-medium">{label}</span>
      </div>
      <div className="flex-1" />
      <span className="text-xs text-slate-400 hidden xl:block capitalize">{today}</span>

      {/* Search */}
      <div ref={searchRef} className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
          onFocus={() => setShowSearch(true)}
          placeholder="Buscar colaboradores, páginas..."
          className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:w-72 transition-all"
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden z-50">
            {searchResults.map((r, i) => (
              <button key={i} onClick={() => { setActive(r.action); setSearch(""); setShowSearch(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left">
                {r.type === "person" ? <User size={14} className="text-blue-500" /> : <Layers size={14} className="text-slate-400" />}
                <div><div className="text-sm font-medium text-slate-800">{r.label}</div><div className="text-xs text-slate-400">{r.sub}</div></div>
              </button>
            ))}
          </div>
        )}
        {showSearch && search.length > 1 && searchResults.length === 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-slate-100 shadow-xl p-4 text-center text-xs text-slate-400 z-50">Sem resultados para "{search}"</div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifsRef} className="relative">
        <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell size={16} />
          {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: "#2563EB" }}>{unread}</span>}
        </button>
        {showNotifs && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-100 shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-900">Notificações</span>
              <div className="flex gap-2">
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">Marcar todas</button>
                <button onClick={clearNotifs} className="text-xs text-slate-400 hover:text-slate-600">Limpar</button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Nenhuma notificação</div>
              ) : notifications.map(n => (
                <div key={n.id} onClick={() => setNotifications(notifications.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}>
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-blue-500" : "bg-transparent"}`} />
                  <div className="flex-1"><p className="text-xs text-slate-700">{n.text}</p><p className="text-[11px] text-slate-400 mt-0.5">{n.time}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => { setActive("reports"); toast.info("Abrindo mensagens..."); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
        <MessageSquare size={16} />
      </button>

      <button onClick={() => setShowHelp(true)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
        <HelpCircle size={16} />
      </button>

      <button onClick={toggleDark} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Profile */}
      <div ref={profileRef} className="relative">
        <button onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
          className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <AvatarEl name={user.name} size="sm" />
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-700">{user.name}</div>
            <div className="text-[11px] text-slate-400">{user.role}</div>
          </div>
          <ChevronDown size={13} className="text-slate-400" />
        </button>
        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-100 shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            {[
              { label: "Meu Perfil", icon: User, action: () => { setActive("employees"); setShowProfile(false); } },
              { label: "Configurações", icon: Settings, action: () => { setActive("settings"); setShowProfile(false); } },
              { label: "Administração", icon: Shield, action: () => { setActive("admin"); setShowProfile(false); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <item.icon size={14} />{item.label}
              </button>
            ))}
            <div className="border-t border-slate-100">
              <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={14} />Sair da conta
              </button>
            </div>
          </div>
        )}
      </div>

      </>}
      <Modal open={showHelp} title="Central de Ajuda" onClose={() => setShowHelp(false)}>
        <div className="space-y-3">
          {[
            { q: "Como adicionar um colaborador?", a: "Acesse Colaboradores → Novo Colaborador" },
            { q: "Como criar uma avaliação?", a: "Acesse Avaliações → Nova Avaliação" },
            { q: "Como exportar relatórios?", a: "Acesse Relatórios → Exportar PDF/Excel/CSV" },
            { q: "Como alterar o tema?", a: "Clique no ícone de lua/sol na barra superior" },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-800">{item.q}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.a}</p>
            </div>
          ))}
          <a href="mailto:suporte@talentflow.com" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-2">
            <Mail size={14} />suporte@talentflow.com
          </a>
        </div>
      </Modal>
    </header>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const sparkVals = [62, 68, 65, 72, 70, 78, 74, 81, 79, 85, 88, 90];

function Dashboard({ setActive, employees, period, setPeriod, onKpiClick }: { setActive: (v: string) => void; employees: Employee[]; period: DashboardPeriod; setPeriod: (value: DashboardPeriod) => void; onKpiClick: (nav: string, metric: string, period: DashboardPeriod) => void }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, [employees.length]);

  const active = employees.filter(e => e.status === "Ativo").length;
  const total = employees.length;
  const kpis = [
    { label: "Total Colaboradores", value: String(total), pct: "+1.8%", up: true, icon: Users, color: "#2563EB", bg: "#EFF6FF", nav: "employees", metric: "total" },
    { label: "Colaboradores Ativos", value: String(active), pct: "+1.5%", up: true, icon: Activity, color: "#16A34A", bg: "#F0FDF4", nav: "employees", metric: "ativos" },
    { label: "Taxa de Turnover", value: "3.2%", pct: "-11%", up: false, icon: TrendingDown, color: "#DC2626", bg: "#FEF2F2", nav: "reports", metric: "turnover" },
    { label: "Absenteísmo", value: "1.8%", pct: "-10%", up: false, icon: Clock, color: "#D97706", bg: "#FFFBEB", nav: "reports", metric: "absenteismo" },
    { label: "Treinamentos", value: "342", pct: "+15.9%", up: true, icon: BookOpen, color: "#0EA5E9", bg: "#F0F9FF", nav: "training", metric: "treinamentos" },
    { label: "Avaliações Pend.", value: "28", pct: "-30%", up: true, icon: AlertCircle, color: "#8B5CF6", bg: "#FAF5FF", nav: "evaluations", metric: "avaliacoes" },
    { label: "Engajamento", value: "87.4%", pct: "+2.5%", up: true, icon: Zap, color: "#2563EB", bg: "#EFF6FF", nav: "analytics", metric: "engajamento" },
    { label: "Performance Média", value: "91.2", pct: "+3.9%", up: true, icon: Star, color: "#16A34A", bg: "#F0FDF4", nav: "reports", metric: "performance" },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-[1600px]">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!employees.length) {
    return (
      <div className="p-6 max-w-[1600px]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <EmptyState
            icon={Users}
            title="Ainda não há colaboradores cadastrados"
            desc="Comece adicionando o primeiro colaborador para ativar o dashboard e os indicadores de RH."
            action="Cadastrar colaborador"
            onAction={() => setActive("employees")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Dashboard Executivo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral do capital humano · {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm">
            {DASHBOARD_PERIODS.map(option => (
              <button key={option.value} onClick={() => setPeriod(option.value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${period === option.value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {option.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => { toast.success("Dados atualizados"); }}>
            <RefreshCw size={14} />Atualizar
          </Button>
          <Button onClick={() => { downloadCSV(employees.map(e => ({ Nome: e.name, Cargo: e.role, Dept: e.dept, Status: e.status })), "dashboard-export.csv"); }}>
            <Download size={14} />Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <button key={i} onClick={() => onKpiClick(k.nav, k.metric, period)} className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white shadow-sm" style={{ background: k.bg }}>
                  <Icon size={18} style={{ color: k.color }} />
                </div>
                <Sparkline data={sparkVals.map((v, j) => v + i * 2 + j % 3)} color={k.color} />
              </div>
              <div className="mb-1 text-3xl font-bold leading-none text-slate-950">{k.value}</div>
              <div className="mb-2 text-xs font-medium text-slate-500">{k.label}</div>
              <div className={`flex items-center gap-1 text-xs font-medium ${k.up ? "text-green-600" : "text-red-500"}`}>
                {k.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {k.pct} <span className="text-slate-400 font-normal">vs mês anterior</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Evolução de Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={perf}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} fill="url(#g1)" dot={false} name="Performance" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Distribuição por Nível</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} /></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} /><span className="text-slate-600">{d.name}</span></div>
                <span className="font-semibold text-slate-900">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar + Employees + Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Headcount por Departamento</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deptData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Colaboradores" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Últimas Admissões</h3>
            <button onClick={() => setActive("employees")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Ver todos</button>
          </div>
          <div className="space-y-3">
            {employees.slice(0, 6).map(e => (
              <div key={e.id} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActive("employees")}>
                <AvatarEl name={e.name} size="sm" photo={e.photo} />
                <div className="flex-1 overflow-hidden"><div className="text-xs font-medium text-slate-800 truncate">{e.name}</div><div className="text-[11px] text-slate-400 truncate">{e.role}</div></div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Employee Form ────────────────────────────────────────────────────────────
const EMPTY_EMP: Omit<Employee, "id" | "score" | "avatar"> = {
  name: "", socialName: "", cpf: "", rg: "", birthDate: "", gender: "", maritalStatus: "", nationality: "Brasileira", naturalness: "",
  email: "", phone: "", mobile: "", cep: "", address: "", city: "", state: "", country: "Brasil",
  matricula: "", role: "", dept: "", manager: "", costCenter: "", company: "TalentFlow S/A", branch: "Matriz SP",
  contractType: "CLT", workModel: "Híbrido", salary: "", workHours: "40h", shift: "Comercial",
  admission: new Date().toLocaleDateString("pt-BR"), experienceDate: "", status: "Ativo", accessProfile: "Colaborador",
  notes: "", benefits: { vt: false, planoSaude: true, planoDental: false, vr: true, va: false, seguro: false, previdencia: false },
  competencies: [], photo: undefined,
};

function EmployeeForm({ initial, onSave, onCancel, onSaveAnother, employees }: {
  initial?: Partial<Employee>; onSave: (e: Employee) => void; onCancel: () => void; onSaveAnother?: () => void; employees: Employee[];
}) {
  const [form, setForm] = useState<Omit<Employee, "id" | "score" | "avatar">>({ ...EMPTY_EMP, ...initial });
  const [tab, setTab] = useState("pessoal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial?.id;

  const tabs = [
    { id: "pessoal", label: "Dados Pessoais" },
    { id: "contato", label: "Contato" },
    { id: "profissional", label: "Profissional" },
    { id: "competencias", label: "Competências" },
    { id: "beneficios", label: "Benefícios" },
    { id: "documentos", label: "Documentos" },
    { id: "observacoes", label: "Observações" },
  ];

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }));
    if (touched[field]) validate({ ...form, [field]: value });
  }

  function validate(f = form) {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Nome obrigatório";
    if (!f.cpf || !validateCPF(f.cpf)) e.cpf = "CPF inválido";
    if (!f.email || !validateEmail(f.email)) e.email = "E-mail inválido";
    if (!f.dept) e.dept = "Departamento obrigatório";
    if (!f.role) e.role = "Cargo obrigatório";
    setErrors(e);
    return !Object.keys(e).length;
  }

  function touch(field: string) { setTouched(t => ({ ...t, [field]: true })); }

  async function handleCEP() {
    if (!form.cep) { toast.error("Informe o CEP"); return; }
    setCepLoading(true);
    const r = await lookupCEP(form.cep);
    setCepLoading(false);
    if (r) {
      setForm(f => ({ ...f, ...r }));
      toast.success("CEP preenchido automaticamente");
    } else { toast.error("CEP não encontrado"); }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem válida"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => set("photo", reader.result as string);
    reader.readAsDataURL(file);
    toast.success("Foto carregada com sucesso");
  }

  async function handleSave(another = false) {
    setTouched({ name: true, cpf: true, email: true, dept: true, role: true });
    if (!validate()) { notifyError("Corrija os erros antes de salvar"); setTab("pessoal"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    const emp: Employee = {
      ...form, id: initial?.id || nextId(employees),
      score: initial?.score || Math.floor(Math.random() * 20 + 75),
      avatar: initials(form.name).toUpperCase(),
    };
    onSave(emp);
    notifySuccess(isEdit ? `${emp.name} atualizado com sucesso` : `${emp.name} cadastrado com sucesso`);
    if (another && onSaveAnother) onSaveAnother();
  }

  const I = ({ label, field, type = "text", placeholder = "", mask }: { label: string; field: string; type?: string; placeholder?: string; mask?: (v: string) => string }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type={type} value={(form as Record<string, unknown>)[field] as string || ""}
        placeholder={placeholder}
        onChange={e => { const v = mask ? mask(e.target.value) : e.target.value; set(field, v); }}
        onBlur={() => touch(field)}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${errors[field] ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}
      />
      {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
    </div>
  );

  const S = ({ label, field, options }: { label: string; field: string; options: string[] }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        <select value={(form as Record<string, unknown>)[field] as string || ""} onChange={e => set(field, e.target.value)}
          className={`w-full appearance-none px-3 py-2 pr-8 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer ${errors[field] ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
          <option value="">Selecione...</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"><ChevronRight size={14} className="rotate-180" />Colaboradores</button>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-sm font-medium text-slate-700">{isEdit ? `Editar: ${initial?.name}` : "Novo Colaborador"}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/80 px-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {tab === "pessoal" && (
            <div className="space-y-5">
              {/* Photo */}
              <div className="flex items-start gap-5">
                <div>
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 flex items-center justify-center bg-slate-50 cursor-pointer relative group" onClick={() => photoRef.current?.click()}>
                    {form.photo ? <img src={form.photo} alt="" className="w-full h-full object-cover" /> : <AvatarEl name={form.name || "?"} size="xl" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => photoRef.current?.click()} className="text-xs text-blue-600 hover:text-blue-700">Alterar</button>
                    {form.photo && <><span className="text-slate-300">·</span><button onClick={() => { set("photo", undefined); toast.info("Foto removida"); }} className="text-xs text-red-500 hover:text-red-600">Remover</button></>}
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <I label="Nome completo *" field="name" placeholder="Ex: João Silva" />
                  <I label="Nome social" field="socialName" placeholder="Como prefere ser chamado(a)" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <I label="CPF *" field="cpf" placeholder="000.000.000-00" mask={maskCPF} />
                <I label="RG" field="rg" placeholder="00.000.000-0" />
                <I label="Data de nascimento" field="birthDate" type="date" />
                <S label="Gênero" field="gender" options={["Masculino", "Feminino", "Não binário", "Prefiro não informar"]} />
                <S label="Estado civil" field="maritalStatus" options={["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável"]} />
                <I label="Nacionalidade" field="nationality" placeholder="Brasileira" />
                <I label="Naturalidade" field="naturalness" placeholder="Cidade de nascimento" />
              </div>
            </div>
          )}

          {tab === "contato" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <I label="E-mail corporativo *" field="email" type="email" placeholder="colaborador@empresa.com" />
              <I label="Telefone fixo" field="phone" placeholder="(11) 3456-7890" mask={maskPhone} />
              <I label="Celular" field="mobile" placeholder="(11) 99999-0000" mask={maskPhone} />
              <div className="flex gap-2 items-end">
                <div className="flex-1"><I label="CEP" field="cep" placeholder="00000-000" mask={maskCEP} /></div>
                <button onClick={handleCEP} disabled={cepLoading} className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 mb-0.5">
                  {cepLoading ? <Spinner /> : <Search size={14} />}
                </button>
              </div>
              <div className="sm:col-span-2"><I label="Endereço" field="address" placeholder="Rua, número, complemento" /></div>
              <I label="Cidade" field="city" placeholder="São Paulo" />
              <S label="Estado" field="state" options={STATES_BR} />
              <I label="País" field="country" placeholder="Brasil" />
            </div>
          )}

          {tab === "profissional" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <I label="Matrícula" field="matricula" placeholder="TF-0000" />
              <S label="Departamento *" field="dept" options={DEPTS} />
              <S label="Cargo *" field="role" options={form.dept ? (ROLES_BY_DEPT[form.dept] || []) : []} />
              <S label="Gestor direto" field="manager" options={employees.map(e => e.name)} />
              <I label="Centro de custo" field="costCenter" placeholder="CC-XXX" />
              <I label="Empresa" field="company" placeholder="TalentFlow S/A" />
              <I label="Filial" field="branch" placeholder="Matriz SP" />
              <S label="Tipo de contrato" field="contractType" options={CONTRACT_TYPES} />
              <S label="Modelo de trabalho" field="workModel" options={WORK_MODELS} />
              <I label="Salário (R$)" field="salary" placeholder="0,00" />
              <S label="Jornada" field="workHours" options={["40h", "30h", "20h", "Flexível"]} />
              <S label="Turno" field="shift" options={["Comercial", "Manhã", "Tarde", "Noite", "Flexível", "12x36"]} />
              <I label="Data de admissão" field="admission" type="date" />
              <I label="Data fim de experiência" field="experienceDate" type="date" />
              <S label="Status" field="status" options={STATUSES} />
              <S label="Perfil de acesso" field="accessProfile" options={ACCESS_PROFILES} />
            </div>
          )}

          {tab === "competencias" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Defina as competências e os níveis esperados para este colaborador.</p>
              {form.competencies.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-800 flex-1">{c.name}</span>
                  <label className="text-xs text-slate-500">Esperado:</label>
                  <input type="number" min={0} max={100} value={c.expected} onChange={e => { const cp = [...form.competencies]; cp[i].expected = +e.target.value; set("competencies", cp); }} className="w-16 px-2 py-1 text-xs border border-slate-200 rounded" />
                  <label className="text-xs text-slate-500">Atual:</label>
                  <input type="number" min={0} max={100} value={c.current} onChange={e => { const cp = [...form.competencies]; cp[i].current = +e.target.value; set("competencies", cp); }} className="w-16 px-2 py-1 text-xs border border-slate-200 rounded" />
                  <button onClick={() => set("competencies", form.competencies.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => set("competencies", [...form.competencies, { name: "Nova Competência", expected: 80, current: 70 }])}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Plus size={14} />Adicionar competência
              </button>
            </div>
          )}

          {tab === "beneficios" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFIT_KEYS.map(k => (
                <label key={k} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.benefits[k] ? "border-blue-200 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="checkbox" checked={!!form.benefits[k]} onChange={e => set("benefits", { ...form.benefits, [k]: e.target.checked })} className="rounded" />
                  <span className="text-sm font-medium text-slate-700">{BENEFIT_LABELS[k]}</span>
                  {form.benefits[k] && <Check size={14} className="text-blue-600 ml-auto" />}
                </label>
              ))}
            </div>
          )}

          {tab === "documentos" && (
            <div className="space-y-4">
              {["RG", "CPF", "CNH", "Contrato de Trabalho", "Comprovante de Residência"].map(doc => (
                <div key={doc} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700">{doc}</span>
                  </div>
                  <label className="flex items-center gap-2 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                    <Upload size={12} />Enviar
                    <input type="file" className="hidden" onChange={() => toast.success(`${doc} enviado com sucesso`)} />
                  </label>
                </div>
              ))}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer" onClick={() => toast.info("Selecione arquivos para upload")}>
                <Upload size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Arraste arquivos ou clique para enviar</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG até 10MB</p>
              </div>
            </div>
          )}

          {tab === "observacoes" && (
            <div className="space-y-4">
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Observações sobre o colaborador..." rows={6}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
              <div className="border border-slate-100 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-700 mb-3">Histórico de alterações</h4>
                <div className="space-y-2 text-xs text-slate-500">
                  {isEdit ? <>
                    <div className="flex gap-2"><span className="text-slate-300">•</span><span>Cadastro inicial criado em {initial?.admission}</span></div>
                    <div className="flex gap-2"><span className="text-slate-300">•</span><span>Último acesso: hoje às 09:12</span></div>
                  </> : <p className="text-slate-300">Histórico disponível após salvar.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <div className="flex gap-2">
            {!isEdit && onSaveAnother && (
              <Button variant="secondary" onClick={() => handleSave(true)} disabled={saving}>
                Salvar e cadastrar outro
              </Button>
            )}
            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? <Spinner /> : <Save size={14} />}
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Employees Table ──────────────────────────────────────────────────────────
function EmployeesView({ employees, setEmployees, setActive, onSelectProfile, onNew, onEdit, period, setPeriod }: {
  employees: Employee[]; setEmployees: (e: Employee[] | ((p: Employee[]) => Employee[])) => void;
  setActive: (v: string) => void; onSelectProfile: (e: Employee) => void;
  onNew: () => void; onEdit: (e: Employee) => void; period: DashboardPeriod; setPeriod: (value: DashboardPeriod) => void;
}) {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState<Employee | null>(null);
  const perPage = 5;

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 800);
    return () => window.clearTimeout(timer);
  }, [employees.length]);

  const periodFilteredEmployees = filterEmployeesByPeriod(employees, period);
  const filtered = periodFilteredEmployees.filter(e => {
    const q = search.toLowerCase();
    return (e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
      && (dept === "Todos" || e.dept === dept)
      && (status === "Todos" || e.status === status);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const shown = filtered.slice((page - 1) * perPage, page * perPage);

  function deleteEmployee(e: Employee) {
    setEmployees((prev: Employee[]) => prev.filter(x => x.id !== e.id));
    toast.success(`${e.name} excluído`);
    setConfirmDel(null);
  }

  function duplicate(e: Employee) {
    const clone: Employee = { ...e, id: nextId(employees), name: e.name + " (Cópia)", matricula: "" };
    setEmployees((prev: Employee[]) => [...prev, clone]);
    toast.success(`${e.name} duplicado`);
  }

  function handleExport() {
    downloadCSV(filtered.map(e => ({ Nome: e.name, Cargo: e.role, Departamento: e.dept, Gestor: e.manager, Email: e.email, Telefone: e.mobile, Admissão: e.admission, Status: e.status, Score: e.score })), "colaboradores.csv");
  }

  function clearFilters() {
    setSearch("");
    setDept("Todos");
    setStatus("Todos");
    setPage(1);
  }

  async function handleImport() {
    await new Promise(r => setTimeout(r, 1200));
    toast.success("Importação concluída: 0 novos registros (arquivo exemplo)");
  }

  return (
    <div className="max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <ConfirmDialog open={!!confirmDel} title="Excluir colaborador" message={`Deseja excluir ${confirmDel?.name}? Esta ação não pode ser desfeita.`} confirmLabel="Excluir" danger onConfirm={() => confirmDel && deleteEmployee(confirmDel)} onCancel={() => setConfirmDel(null)} />

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{periodFilteredEmployees.length} colaboradores em {getPeriodLabel(period).toLowerCase()} · {periodFilteredEmployees.filter(e => e.status === "Ativo").length} ativos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <Upload size={14} />Importar
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImport} />
          </label>
          <Button onClick={onNew}>
            <Plus size={15} />Novo Colaborador
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nome, cargo ou e-mail..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          {[{ label: "Departamento", val: dept, set: (v: string) => { setDept(v); setPage(1); }, opts: ["Todos", ...DEPTS] },
            { label: "Status", val: status, set: (v: string) => { setStatus(v); setPage(1); }, opts: ["Todos", ...STATUSES] }].map(f => (
            <div key={f.label} className="relative">
              <select value={f.val} onChange={e => f.set(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer">
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              {DASHBOARD_PERIODS.map(option => (
                <button key={option.value} onClick={() => setPeriod(option.value)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${period === option.value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {option.label}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={handleExport}>
              <Download size={14} />Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[620px] overflow-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90">
              {["Colaborador", "Cargo / Dept.", "Gestor", "Admissão", "Status", "Score", ""].map((h, i) => (
                <th key={i} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left ${i >= 2 ? "hidden md:table-cell" : ""} ${i === 6 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(perPage)].map((_, i) => <SkeletonRow key={i} />) : shown.length === 0 ? (
              <tr><td colSpan={7} className="py-1"><EmptyState icon={Users} title={employees.length === 0 ? "Ainda não há colaboradores cadastrados" : "Nenhum colaborador atende aos filtros"} desc={employees.length === 0 ? "Cadastre o primeiro colaborador para começar a acompanhar a equipe." : "Ajuste a busca ou limpe os filtros para encontrar mais resultados."} action={employees.length === 0 ? "Novo Colaborador" : "Limpar filtros"} onAction={employees.length === 0 ? onNew : clearFilters} /></td></tr>
            ) : shown.map(e => (
              <tr key={e.id} className="group cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/35" onClick={() => onSelectProfile(e)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AvatarEl name={e.name} size="sm" photo={e.photo} />
                    <div><div className="text-sm font-medium text-slate-900">{e.name}</div><div className="text-xs text-slate-400">{e.email}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3"><div className="text-sm text-slate-700">{e.role}</div><div className="text-xs text-slate-400">{e.dept}</div></td>
                <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell">{e.manager || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell">{e.admission}</td>
                <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${e.score}%`, background: e.score >= 90 ? "#16A34A" : e.score >= 75 ? "#2563EB" : "#D97706" }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{e.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {([
                      { Icon: Eye, label: "Visualizar", action: () => onSelectProfile(e), cls: "text-slate-400 hover:text-slate-700 hover:bg-slate-100" },
                      { Icon: Edit2, label: "Editar", action: () => { onEdit(e); }, cls: "text-slate-400 hover:text-blue-600 hover:bg-blue-50" },
                      { Icon: Copy, label: "Duplicar", action: () => { duplicate(e); }, cls: "text-slate-400 hover:text-slate-700 hover:bg-slate-100" },
                    ]).map(({ Icon, label, action, cls }) => (
                      <button key={label} title={label} onClick={ev => { ev.stopPropagation(); action(); }} className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${cls}`}>
                        <Icon size={13} />
                      </button>
                    ))}
                    <button title="Excluir" onClick={ev => { ev.stopPropagation(); setConfirmDel(e); }} className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-slate-400">{filtered.length} resultado(s) · Página {page} de {pages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronRight size={13} className="rotate-180" /></button>
            {[...Array(Math.min(pages, 5))].map((_, i) => {
              const p = i + 1;
              return <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${p === page ? "text-white" : "text-slate-500 hover:bg-slate-100"}`} style={p === page ? { background: "#2563EB" } : {}}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Employee Profile ─────────────────────────────────────────────────────────
function EmployeeProfile({ employee: initial, employees, setEmployees, onBack, onEdit }: {
  employee: Employee; employees: Employee[]; setEmployees: (e: Employee[] | ((p: Employee[]) => Employee[])) => void; onBack: () => void; onEdit: () => void;
}) {
  const employee = employees.find(e => e.id === initial.id) || initial;
  const [tab, setTab] = useState("resumo");
  const [promoteModal, setPromoteModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [fireModal, setFireModal] = useState(false);
  const [newRole, setNewRole] = useState(employee.role);
  const [newDept, setNewDept] = useState(employee.dept);
  const [fireReason, setFireReason] = useState("");
  const tabs = ["resumo", "competencias", "avaliacoes", "treinamentos", "documentos", "metas", "historico"];
  const tabLabels: Record<string, string> = { resumo: "Resumo", competencias: "Competências", avaliacoes: "Avaliações", treinamentos: "Treinamentos", documentos: "Documentos", metas: "Metas", historico: "Histórico" };

  function update(patch: Partial<Employee>) {
    setEmployees((prev: Employee[]) => prev.map(e => e.id === employee.id ? { ...e, ...patch } : e));
  }

  function promote() {
    if (!newRole) { toast.error("Selecione um cargo"); return; }
    update({ role: newRole });
    setPromoteModal(false);
    toast.success(`${employee.name} promovido(a) para ${newRole}`);
  }

  function transfer() {
    if (!newDept) { toast.error("Selecione um departamento"); return; }
    update({ dept: newDept });
    setTransferModal(false);
    toast.success(`${employee.name} transferido(a) para ${newDept}`);
  }

  function fire() {
    if (!fireReason) { toast.error("Informe o motivo"); return; }
    update({ status: "Inativo" });
    setFireModal(false);
    toast.success(`${employee.name} desligado(a) do sistema`);
  }

  function reactivate() {
    update({ status: "Ativo" });
    toast.success(`${employee.name} reativado(a) com sucesso`);
  }

  const isInactive = employee.status === "Inativo";
  const historyItems = [
    { label: "Admissão", value: employee.admission, detail: `Entrada em ${employee.company}` },
    { label: "Cargo atual", value: employee.role, detail: `${employee.dept} · ${employee.manager || "Sem gestor definido"}` },
    { label: "Modelo de trabalho", value: employee.workModel, detail: `${employee.contractType} · ${employee.workHours}` },
    { label: "Última atualização", value: "Hoje", detail: employee.status === "Ativo" ? "Perfil ativo e alinhado ao plano atual" : "Status revisado recentemente" },
  ];
  const statusInfo: Record<string, { tone: string; text: string }> = {
    Ativo: { tone: "success", text: "Colaborador em jornada regular e com performance alinhada ao plano atual." },
    Férias: { tone: "info", text: "Colaborador em período de férias, com retomada prevista para o próximo ciclo." },
    Afastado: { tone: "warning", text: "Colaborador em afastamento, com acompanhamento e comunicação em andamento." },
    Inativo: { tone: "error", text: "Colaborador desligado da organização ou fora do time ativo." },
  };
  const [evaluations] = useLocalStorage<Evaluation[]>("evaluations", SEED_EVALUATIONS);
  const receivedEvaluations = evaluations.slice(0, 3);

  return (
    <div className="p-6 max-w-[1400px]">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors">
        <ChevronRight size={14} className="rotate-180" />Colaboradores
      </button>

      <div className="bg-white rounded-xl border border-slate-100 p-6 mb-4">
        <div className="flex flex-wrap items-start gap-5">
          <div className="relative">
            <AvatarEl name={employee.name} size="xl" photo={employee.photo} />
            {employee.status === "Ativo" && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-sm text-slate-600 mt-0.5">{employee.role} · {employee.dept}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Mail size={12} />{employee.email}</span>
              <span className="flex items-center gap-1.5"><Phone size={12} />{employee.mobile}</span>
              <span className="flex items-center gap-1.5"><Calendar size={12} />Desde {employee.admission}</span>
              <span className="flex items-center gap-1.5"><Building2 size={12} />{employee.company}</span>
              {employee.manager && <span className="flex items-center gap-1.5"><User size={12} />{employee.manager}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" onClick={onEdit}><Edit2 size={13} />Editar</Button>
            <Button variant="secondary" onClick={() => { setNewRole(employee.role); setPromoteModal(true); }}>Promover</Button>
            <Button variant="secondary" onClick={() => { setNewDept(employee.dept); setTransferModal(true); }}>Transferir</Button>
            {isInactive
              ? <Button variant="secondary" onClick={reactivate} className="border-green-200 text-green-700 hover:bg-green-50">Reativar</Button>
              : <Button variant="destructive" onClick={() => setFireModal(true)}>Desligar</Button>
            }
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-5 pt-5 border-t border-slate-100">
          {[{ l: "Score", v: employee.score }, { l: "Modelo", v: employee.workModel }, { l: "Contrato", v: employee.contractType }, { l: "Jornada", v: employee.workHours }, { l: "Acesso", v: employee.accessProfile }, { l: "Matrícula", v: employee.matricula || "—" }].map((s, i) => (
            <div key={i} className="text-center"><div className="text-base font-bold text-slate-900">{s.v}</div><div className="text-xs text-slate-400">{s.l}</div></div>
          ))}
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "resumo" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Dados pessoais</h3>
                  <Badge variant="gray">{employee.accessProfile}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Nome social</p>
                    <p className="font-medium text-slate-800 mt-1">{employee.socialName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">CPF</p>
                    <p className="font-medium text-slate-800 mt-1">{employee.cpf || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">E-mail</p>
                    <p className="font-medium text-slate-800 mt-1">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Telefone</p>
                    <p className="font-medium text-slate-800 mt-1">{employee.mobile || employee.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Endereço</p>
                    <p className="font-medium text-slate-800 mt-1">{employee.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Cidade / Estado</p>
                    <p className="font-medium text-slate-800 mt-1">{[employee.city, employee.state].filter(Boolean).join(" / ") || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Cargo e histórico</h3>
                <div className="space-y-3">
                  {historyItems.map(item => (
                    <div key={item.label} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-sm text-slate-600">{item.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Status</h3>
                  <StatusBadge status={employee.status} />
                </div>
                <p className="text-sm text-slate-600">{statusInfo[employee.status]?.text || "Status atualizado recentemente."}</p>
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <span className="text-slate-500">Departamento</span>
                    <span className="font-medium text-slate-800">{employee.dept}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <span className="text-slate-500">Gestor</span>
                    <span className="font-medium text-slate-800">{employee.manager || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <span className="text-slate-500">Benefícios</span>
                    <span className="font-medium text-slate-800">{Object.values(employee.benefits).filter(Boolean).length} ativos</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Avaliações recebidas</h3>
                  <Badge variant="primary">{receivedEvaluations.length}</Badge>
                </div>
                {receivedEvaluations.length > 0 ? (
                  <div className="space-y-2">
                    {receivedEvaluations.map(ev => (
                      <div key={ev.id} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                          <Badge variant="gray">{ev.type}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{ev.period || "Período não informado"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma avaliação registrada para este colaborador ainda.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Performance ao longo do tempo</h3>
              <Badge variant="success">Score {employee.score}</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={perf}>
                <defs><linearGradient id="epg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} fill="url(#epg)" dot={false} name="Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "competencias" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(employee.competencies.length ? employee.competencies : [
            { name: "Liderança", expected: 80, current: 72 },
            { name: "Comunicação", expected: 85, current: 80 },
            { name: "Técnico", expected: 90, current: 88 },
            { name: "Inovação", expected: 75, current: 70 },
          ]).map((c, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">{c.name}</h3>
                <Badge variant={c.current >= c.expected ? "success" : "warning"}>Gap: {c.current - c.expected}</Badge>
              </div>
              {[{ label: "Atual", val: c.current, color: "#2563EB" }, { label: "Esperado", val: c.expected, color: "#E2E8F0" }].map(b => (
                <div key={b.label} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-slate-500 w-16">{b.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${b.val}%`, background: b.color }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-6">{b.val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {["avaliacoes", "treinamentos", "documentos", "metas", "historico"].includes(tab) && (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">{tabLabels[tab]}</h3>
            <button onClick={() => toast.info(`Criando ${tabLabels[tab].toLowerCase()}...`)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Plus size={13} />Novo</button>
          </div>
          <EmptyState icon={FileText} title={`Sem ${tabLabels[tab].toLowerCase()}`} desc="Os registros aparecerão aqui quando disponíveis." />
        </div>
      )}

      <Modal open={promoteModal} title="Promover Colaborador" onClose={() => setPromoteModal(false)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Selecione o novo cargo para <strong>{employee.name}</strong>:</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Novo cargo</label>
            <div className="relative">
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {(ROLES_BY_DEPT[employee.dept] || []).map(r => <option key={r}>{r}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setPromoteModal(false)}>Cancelar</Button>
            <Button onClick={promote}>Confirmar Promoção</Button>
          </div>
        </div>
      </Modal>

      <Modal open={transferModal} title="Transferir Colaborador" onClose={() => setTransferModal(false)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Selecione o novo departamento para <strong>{employee.name}</strong>:</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Novo departamento</label>
            <div className="relative">
              <select value={newDept} onChange={e => setNewDept(e.target.value)} className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setTransferModal(false)}>Cancelar</Button>
            <Button onClick={transfer}>Confirmar Transferência</Button>
          </div>
        </div>
      </Modal>

      <Modal open={fireModal} title="Desligar Colaborador" onClose={() => setFireModal(false)}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">Você está desligando <strong>{employee.name}</strong>. Esta ação alterará o status para Inativo.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Motivo do desligamento *</label>
            <textarea value={fireReason} onChange={e => setFireReason(e.target.value)} rows={3} placeholder="Descreva o motivo..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setFireModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={fire}>Confirmar Desligamento</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Competencies ─────────────────────────────────────────────────────────────
function CompetenciesView() {
  const [comps, setComps] = useLocalStorage<Competency[]>("competencies", SEED_COMPETENCIES);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState<Competency | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Competency | null>(null);
  const [form, setForm] = useState<Omit<Competency, "id">>({ name: "", category: "Comportamental", description: "", active: true });

  const filtered = comps.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));
  const cats = ["Comportamental", "Cognitiva", "Técnica", "Atitudinal"];
  const catColors: Record<string, string> = { Comportamental: "primary", Cognitiva: "purple", Técnica: "info", Atitudinal: "success" };

  function openNew() { setForm({ name: "", category: "Comportamental", description: "", active: true }); setIsNew(true); setEditModal({ id: 0, name: "", category: "Comportamental", description: "", active: true }); }
  function openEdit(c: Competency) { setForm({ name: c.name, category: c.category, description: c.description, active: c.active }); setIsNew(false); setEditModal(c); }
  function save() {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (isNew) {
      setComps(prev => [...prev, { ...form, id: nextId(comps) }]);
      toast.success(`Competência "${form.name}" criada`);
    } else if (editModal) {
      setComps(prev => prev.map(c => c.id === editModal.id ? { ...c, ...form } : c));
      toast.success(`Competência atualizada`);
    }
    setEditModal(null);
  }
  function remove(c: Competency) { setComps(prev => prev.filter(x => x.id !== c.id)); toast.success(`${c.name} excluída`); setConfirmDel(null); }
  function toggleActive(c: Competency) {
    setComps(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
    toast.success(c.active ? `${c.name} desativada` : `${c.name} ativada`);
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <ConfirmDialog open={!!confirmDel} title="Excluir competência" message={`Deseja excluir a competência "${confirmDel?.name}"?`} confirmLabel="Excluir" danger onConfirm={() => confirmDel && remove(confirmDel)} onCancel={() => setConfirmDel(null)} />
      <Modal open={!!editModal} title={isNew ? "Nova Competência" : "Editar Competência"} onClose={() => setEditModal(null)}>
        <div className="space-y-4">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Ex: Liderança" /></div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
            <div className="relative">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" /></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /><span className="text-sm text-slate-700">Competência ativa</span></label>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={save} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}>Salvar</button>
          </div>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Competências</h1><p className="text-sm text-slate-500 mt-0.5">{comps.filter(c => c.active).length} ativas · {comps.length} total</p></div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Plus size={15} />Nova Competência</button>
      </div>

      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar competências..." className="w-full max-w-sm pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={Award} title="Nenhuma competência" desc="Crie sua primeira competência clicando em Nova Competência." action="Nova Competência" onAction={openNew} /></div>
        ) : filtered.map(c => (
          <div key={c.id} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${c.active ? "border-slate-100" : "border-slate-200 opacity-60"}`}>
            <div className="flex items-start justify-between mb-2">
              <Badge variant={catColors[c.category] || "default"}>{c.category}</Badge>
              <div className="flex gap-1">
                <button onClick={() => toggleActive(c)} className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors ${c.active ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100"}`}>{c.active ? <Check size={13} /> : <Ban size={13} />}</button>
                <button onClick={() => openEdit(c)} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => setConfirmDel(c)} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">{c.name}</h3>
            <p className="text-xs text-slate-500">{c.description || "Sem descrição"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evaluations ──────────────────────────────────────────────────────────────
function EvaluationsView({ employees }: { employees: Employee[] }) {
  const [evals, setEvals] = useLocalStorage<Evaluation[]>("evaluations", SEED_EVALUATIONS);
  const [showForm, setShowForm] = useState(false);
  const [answerModal, setAnswerModal] = useState<Evaluation | null>(null);
  const [confirmDel, setConfirmDel] = useState<Evaluation | null>(null);
  const [form, setForm] = useState({ title: "", type: "360°", period: "", deadline: "", employees: [] as number[] });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const types = ["360°", "180°", "90°", "Autoavaliação", "Feedback"];
  const statusColors: Record<string, string> = { Rascunho: "gray", Publicado: "primary", Encerrado: "success" };

  function createEval() {
    if (!form.title) { toast.error("Título obrigatório"); return; }
    const e: Evaluation = { ...form, id: nextId(evals), status: "Rascunho", createdAt: new Date().toLocaleDateString("pt-BR"), answers: 0 };
    setEvals(prev => [...prev, e]);
    setShowForm(false);
    toast.success("Avaliação criada como rascunho");
  }

  function updateStatus(e: Evaluation, status: string) {
    setEvals(prev => prev.map(x => x.id === e.id ? { ...x, status } : x));
    toast.success(status === "Publicado" ? "Avaliação publicada" : "Avaliação encerrada");
  }

  function deleteEval(e: Evaluation) { setEvals(prev => prev.filter(x => x.id !== e.id)); toast.success("Avaliação excluída"); setConfirmDel(null); }

  function submitAnswers() {
    if (!answerModal) return;
    setEvals(prev => prev.map(e => e.id === answerModal.id ? { ...e, answers: e.answers + 1 } : e));
    setAnswerModal(null);
    toast.success("Avaliação respondida com sucesso!");
  }

  const criteria = ["Liderança", "Comunicação", "Trabalho em Equipe", "Resultado", "Inovação"];

  return (
    <div className="p-6 max-w-[1200px]">
      <ConfirmDialog open={!!confirmDel} title="Excluir avaliação" message={`Excluir "${confirmDel?.title}"?`} confirmLabel="Excluir" danger onConfirm={() => confirmDel && deleteEval(confirmDel)} onCancel={() => setConfirmDel(null)} />

      <Modal open={!!answerModal} title={`Responder: ${answerModal?.title}`} onClose={() => setAnswerModal(null)}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Avalie cada critério de 1 (Insuficiente) a 5 (Excelente)</p>
          {criteria.map(c => (
            <div key={c}>
              <div className="flex items-center justify-between mb-1"><label className="text-sm font-medium text-slate-700">{c}</label><span className="text-sm font-bold text-blue-600">{answers[c] || "—"}</span></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setAnswers(a => ({ ...a, [c]: n }))} className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${answers[c] === n ? "border-blue-600 text-white" : "border-slate-200 text-slate-600 hover:border-blue-400"}`} style={answers[c] === n ? { background: "#2563EB" } : {}}>{n}</button>
                ))}
              </div>
            </div>
          ))}
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Comentário (opcional)</label><textarea rows={3} placeholder="Adicione observações..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setAnswerModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={submitAnswers} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}>Enviar Respostas</button>
          </div>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Avaliações</h1><p className="text-sm text-slate-500 mt-0.5">{evals.length} avaliações</p></div>
        <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}>{showForm ? <X size={15} /> : <Plus size={15} />}{showForm ? "Cancelar" : "Nova Avaliação"}</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Criar nova avaliação</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Título *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Ciclo Avaliativo Q1 2025" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <div className="relative"><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30">{types.map(t => <option key={t}>{t}</option>)}</select><ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
            </div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Período</label><input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} placeholder="Ex: Jan–Mar 2025" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Prazo</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={createEval} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}>Criar Avaliação</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {evals.length === 0 ? <EmptyState icon={Star} title="Sem avaliações" desc="Crie uma nova avaliação para começar." action="Nova Avaliação" onAction={() => setShowForm(true)} /> : evals.map(e => (
          <div key={e.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><Badge variant={statusColors[e.status] || "default"}>{e.status}</Badge><Badge variant="gray">{e.type}</Badge></div>
                <h3 className="text-sm font-semibold text-slate-900">{e.title}</h3>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                  {e.period && <span><Calendar size={11} className="inline mr-1" />{e.period}</span>}
                  <span><Users size={11} className="inline mr-1" />{e.employees.length} participantes</span>
                  <span><CheckCircle2 size={11} className="inline mr-1" />{e.answers} respostas</span>
                  {e.deadline && <span><Clock size={11} className="inline mr-1" />Prazo: {e.deadline}</span>}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {e.status !== "Encerrado" && <button onClick={() => setAnswerModal(e)} className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">Responder</button>}
                {e.status === "Rascunho" && <button onClick={() => updateStatus(e, "Publicado")} className="px-3 py-1.5 text-xs text-white rounded-lg transition-colors" style={{ background: "#16A34A" }}>Publicar</button>}
                {e.status === "Publicado" && <button onClick={() => updateStatus(e, "Encerrado")} className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Encerrar</button>}
                <button onClick={() => toast.info("Edição em desenvolvimento")} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => setConfirmDel(e)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kanban ───────────────────────────────────────────────────────────────────
function KanbanView() {
  const [cols, setCols] = useLocalStorage<KanbanColumn[]>("kanban", SEED_KANBAN);
  const [dragging, setDragging] = useState<{ card: KanbanCard; fromCol: string } | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ title: "", priority: "Média", assignee: "", deadline: "", tags: "" });
  const [confirmDel, setConfirmDel] = useState<{ card: KanbanCard; col: string } | null>(null);
  const priorities = ["Urgente", "Alta", "Média", "Baixa"];

  function moveCard(cardId: number, fromCol: string, toCol: string) {
    if (fromCol === toCol) return;
    setCols(prev => {
      const card = prev.find(c => c.id === fromCol)?.cards.find(c => c.id === cardId);
      if (!card) return prev;
      return prev.map(col => {
        if (col.id === fromCol) return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        if (col.id === toCol) return { ...col, cards: [...col.cards, card] };
        return col;
      });
    });
    toast.success("Tarefa movida");
  }

  function addCard(colId: string) {
    if (!newCard.title.trim()) { toast.error("Título obrigatório"); return; }
    const allCards = cols.flatMap(c => c.cards);
    const card: KanbanCard = { id: nextId(allCards), title: newCard.title, priority: newCard.priority, assignee: newCard.assignee || "?", deadline: newCard.deadline, tags: newCard.tags ? newCard.tags.split(",").map(t => t.trim()) : [], description: "", checklist: [] };
    setCols(prev => prev.map(col => col.id === colId ? { ...col, cards: [...col.cards, card] } : col));
    setAddModal(null);
    setNewCard({ title: "", priority: "Média", assignee: "", deadline: "", tags: "" });
    toast.success("Tarefa adicionada");
  }

  function deleteCard(colId: string, cardId: number) {
    setCols(prev => prev.map(col => col.id === colId ? { ...col, cards: col.cards.filter(c => c.id !== cardId) } : col));
    toast.success("Tarefa excluída");
    setConfirmDel(null);
  }

  function toggleChecklist(colId: string, cardId: number, idx: number) {
    setCols(prev => prev.map(col => col.id === colId ? {
      ...col, cards: col.cards.map(c => c.id === cardId ? { ...c, checklist: c.checklist.map((item, i) => i === idx ? { ...item, done: !item.done } : item) } : c)
    } : col));
  }

  return (
    <div className="p-6 max-w-[1600px]">
      <ConfirmDialog open={!!confirmDel} title="Excluir tarefa" message={`Excluir "${confirmDel?.card.title}"?`} confirmLabel="Excluir" danger onConfirm={() => confirmDel && deleteCard(confirmDel.col, confirmDel.card.id)} onCancel={() => setConfirmDel(null)} />

      <Modal open={!!addModal} title="Nova Tarefa" onClose={() => setAddModal(null)}>
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Título *</label><input value={newCard.title} onChange={e => setNewCard(n => ({ ...n, title: e.target.value }))} placeholder="Descreva a tarefa..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Prioridade</label>
            <div className="relative"><select value={newCard.priority} onChange={e => setNewCard(n => ({ ...n, priority: e.target.value }))} className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none">{priorities.map(p => <option key={p}>{p}</option>)}</select><ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Responsável (iniciais)</label><input value={newCard.assignee} onChange={e => setNewCard(n => ({ ...n, assignee: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="Ex: RM" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Prazo</label><input value={newCard.deadline} onChange={e => setNewCard(n => ({ ...n, deadline: e.target.value }))} placeholder="Ex: 15 Jan" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Tags (separadas por vírgula)</label><input value={newCard.tags} onChange={e => setNewCard(n => ({ ...n, tags: e.target.value }))} placeholder="Ex: RH, Urgente" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setAddModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={() => addModal && addCard(addModal)} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}>Adicionar</button>
          </div>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Kanban</h1><p className="text-sm text-slate-500 mt-0.5">Gestão de tarefas · {cols.reduce((s, c) => s + c.cards.length, 0)} tarefas</p></div>
        <button onClick={() => { setAddModal("todo"); }} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Plus size={14} />Nova Tarefa</button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {cols.map(col => (
          <div key={col.id} className="flex-shrink-0 w-72 flex flex-col"
            onDragOver={e => { e.preventDefault(); setOverCol(col.id); }}
            onDrop={e => { e.preventDefault(); if (dragging && dragging.fromCol !== col.id) { moveCard(dragging.card.id, dragging.fromCol, col.id); } setDragging(null); setOverCol(null); }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{col.cards.length}</span>
              </div>
              <button onClick={() => setAddModal(col.id)} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Plus size={14} /></button>
            </div>
            <div className={`flex flex-col gap-2.5 flex-1 min-h-[200px] rounded-xl p-2 transition-colors ${overCol === col.id ? "bg-blue-50/80 border border-dashed border-blue-300" : "bg-slate-50/60"}`}>
              {col.cards.map(card => {
                const done = card.checklist.filter(c => c.done).length;
                return (
                  <div key={card.id} draggable onDragStart={() => setDragging({ card, fromCol: col.id })} onDragEnd={() => { setDragging(null); setOverCol(null); }}
                    className={`bg-white rounded-lg border border-slate-100 p-3.5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group ${dragging?.card.id === card.id ? "opacity-40 scale-95" : ""}`}
                  >
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {card.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{t}</span>)}
                    </div>
                    <p className="text-sm font-medium text-slate-800 leading-snug mb-2">{card.title}</p>
                    {card.checklist.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {card.checklist.map((item, idx) => (
                          <label key={idx} className="flex items-center gap-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={item.done} onChange={() => toggleChecklist(col.id, card.id, idx)} className="rounded" />
                            <span className={`text-xs ${item.done ? "line-through text-slate-400" : "text-slate-600"}`}>{item.text}</span>
                          </label>
                        ))}
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: card.checklist.length ? `${(done / card.checklist.length) * 100}%` : "0%" }} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <PriorityBadge p={card.priority} />
                      <div className="flex items-center gap-2">
                        {card.deadline && <span className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar size={11} />{card.deadline}</span>}
                        <AvatarEl name={card.assignee || "?"} size="xs" />
                        <button onClick={e => { e.stopPropagation(); setConfirmDel({ card, col: col.id }); }} className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-red-400 hover:text-red-600 transition-all"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {col.cards.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-300 py-6 cursor-pointer" onClick={() => setAddModal(col.id)}>
                  <Plus size={16} className="mb-1 opacity-40" />Adicionar tarefa
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Certificates ─────────────────────────────────────────────────────────────
function CertificatesView({ employees }: { employees: Employee[] }) {
  const [certs, setCerts] = useLocalStorage<Certificate[]>("certificates", SEED_CERTIFICATES);
  const [issueModal, setIssueModal] = useState(false);
  const [form, setForm] = useState({ employee: "", course: "", expires: "" });

  function issue() {
    if (!form.employee || !form.course) { toast.error("Preencha todos os campos"); return; }
    const c: Certificate = { id: nextId(certs), employee: form.employee, course: form.course, issuedAt: new Date().toLocaleDateString("pt-BR"), expires: form.expires || "Sem vencimento", code: "TF-CERT-" + String(nextId(certs)).padStart(4, "0") };
    setCerts(prev => [...prev, c]);
    setIssueModal(false);
    setForm({ employee: "", course: "", expires: "" });
    toast.success("Certificado emitido com sucesso");
  }

  function download(c: Certificate) {
    const content = `CERTIFICADO DE CONCLUSÃO\n\nEste certificado atesta que\n\n${c.employee}\n\nconcluiu com êxito o curso\n\n${c.course}\n\nEmitido em: ${c.issuedAt}\nVálido até: ${c.expires}\nCódigo: ${c.code}\n\nTalentFlow Enterprise HR`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${c.code}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificado baixado");
  }

  function share(c: Certificate) {
    const text = `Certificado: ${c.course} | ${c.employee} | Código: ${c.code}`;
    navigator.clipboard?.writeText(text).then(() => toast.success("Link copiado para a área de transferência")).catch(() => toast.info("Copie: " + c.code));
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <Modal open={issueModal} title="Emitir Certificado" onClose={() => setIssueModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Colaborador *</label>
            <div className="relative">
              <select value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))} className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="">Selecione...</option>
                {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Curso / Treinamento *</label><input value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} placeholder="Nome do curso" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Data de expiração</label><input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setIssueModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={issue} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}>Emitir Certificado</button>
          </div>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Certificados</h1><p className="text-sm text-slate-500 mt-0.5">{certs.length} emitidos</p></div>
        <button onClick={() => setIssueModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Plus size={15} />Emitir Certificado</button>
      </div>

      <div className="space-y-3">
        {certs.length === 0 ? <EmptyState icon={FileText} title="Nenhum certificado" desc="Emita o primeiro certificado clicando no botão acima." /> : certs.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
              <FileText size={18} style={{ color: "#2563EB" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate">{c.course}</h3>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                <span>{c.employee}</span>
                <span>Emitido: {c.issuedAt}</span>
                <span>Válido: {c.expires}</span>
                <Badge variant="gray">{c.code}</Badge>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => download(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"><Download size={12} />Download</button>
              <button onClick={() => share(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"><Share2 size={12} />Compartilhar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function ReportsView({ employees, period, setPeriod }: { employees: Employee[]; period: DashboardPeriod; setPeriod: (value: DashboardPeriod) => void }) {
  const [dept, setDept] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [loading, setLoading] = useState(false);

  async function refresh() { setLoading(true); await new Promise(r => setTimeout(r, 800)); setLoading(false); toast.success("Dados atualizados"); }

  const periodFilteredEmployees = filterEmployeesByPeriod(employees, period);
  const filtered = periodFilteredEmployees.filter(e => (dept === "Todos" || e.dept === dept) && (status === "Todos" || e.status === status));

  function exportCSV() { downloadCSV(filtered.map(e => ({ Nome: e.name, Cargo: e.role, Dept: e.dept, Status: e.status, Score: e.score, Admissão: e.admission })), "relatorio-colaboradores.csv"); }
  function exportPDF() { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<html><head><title>Relatório TalentFlow</title></head><body><h1>TalentFlow — Relatório de Colaboradores</h1><p>Gerado em: ${new Date().toLocaleDateString("pt-BR")}</p><p>Filtros: Departamento: ${dept} | Status: ${status}</p><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:13px"><tr><th>Nome</th><th>Cargo</th><th>Dept.</th><th>Status</th><th>Score</th></tr>${filtered.map(e => `<tr><td>${e.name}</td><td>${e.role}</td><td>${e.dept}</td><td>${e.status}</td><td>${e.score}</td></tr>`).join("")}</table></body></html>`); w.document.close(); w.print(); toast.success("Abrindo visualização de impressão"); }

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Relatórios</h1><p className="text-sm text-slate-500 mt-0.5">Análises e exportações de dados · {getPeriodLabel(period)}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {DASHBOARD_PERIODS.map(option => (
              <button key={option.value} onClick={() => setPeriod(option.value)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${period === option.value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {option.label}
              </button>
            ))}
          </div>
          <button onClick={refresh} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Atualizar
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"><Printer size={14} />PDF</button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><FileDown size={14} />Exportar CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 flex flex-wrap gap-3 items-center">
        {[{ label: "Departamento", val: dept, set: setDept, opts: ["Todos", ...DEPTS] }, { label: "Status", val: status, set: setStatus, opts: ["Todos", ...STATUSES] }].map(f => (
          <div key={f.label} className="relative">
            <select value={f.val} onChange={e => f.set(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer">
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        ))}
        <span className="text-xs text-slate-500 ml-2">{filtered.length} resultado(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={STATUSES.map(s => ({ status: s, count: employees.filter(e => e.status === s).length }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Colaboradores" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Score médio por Departamento</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DEPTS.map(d => {
              const emps = employees.filter(e => e.dept === d);
              return { dept: d.slice(0, 8), avg: emps.length ? Math.round(emps.reduce((s, e) => s + e.score, 0) / emps.length) : 0 };
            }).filter(d => d.avg > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="avg" fill="#16A34A" radius={[4, 4, 0, 0]} name="Score médio" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Dados detalhados</h3>
          <span className="text-xs text-slate-400">{filtered.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">{["Nome", "Cargo", "Departamento", "Status", "Score", "Admissão"].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{e.name}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{e.role}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{e.dept}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-slate-800">{e.score}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-500">{e.admission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: AppSettings = { theme: "light", language: "pt-BR", notifications: true, emailNotif: true, smsNotif: false };

function SettingsView({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const [saved, setSaved] = useLocalStorage<AppSettings>("settings", DEFAULT_SETTINGS);
  const [form, setForm] = useState<AppSettings>(saved);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  function set(k: keyof AppSettings, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaved(form);
    if (form.theme === "dark" && !dark) { setDark(true); document.documentElement.classList.add("dark"); }
    if (form.theme === "light" && dark) { setDark(false); document.documentElement.classList.remove("dark"); }
    setSaving(false);
    toast.success("Configurações salvas com sucesso");
  }

  function restore() { setForm(DEFAULT_SETTINGS); toast.info("Configurações restauradas ao padrão"); }
  function cancel() { setForm(saved); toast.info("Alterações descartadas"); }

  async function changePassword() {
    if (!pwForm.current) { toast.error("Informe a senha atual"); return; }
    if (pwForm.next.length < 6) { toast.error("Nova senha deve ter ao menos 6 caracteres"); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error("As senhas não coincidem"); return; }
    await new Promise(r => setTimeout(r, 800));
    setPwForm({ current: "", next: "", confirm: "" });
    toast.success("Senha alterada com sucesso");
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="p-6 max-w-[900px] space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Configurações</h1><p className="text-sm text-slate-500 mt-0.5">Personalize sua experiência no TalentFlow</p></div>
      </div>

      <Section title="Aparência">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-slate-800">Tema</p><p className="text-xs text-slate-500">Escolha entre tema claro ou escuro</p></div>
            <div className="flex gap-2">
              {["light", "dark"].map(t => (
                <button key={t} onClick={() => set("theme", t)} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${form.theme === t ? "border-blue-600 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {t === "light" ? "☀️ Claro" : "🌙 Escuro"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-slate-800">Idioma</p><p className="text-xs text-slate-500">Idioma da interface</p></div>
            <div className="relative">
              <select value={form.language} onChange={e => set("language", e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer">
                <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="es-ES">🇪🇸 Español</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Notificações">
        {[
          { label: "Notificações no sistema", desc: "Alertas e lembretes dentro da plataforma", key: "notifications" },
          { label: "Notificações por e-mail", desc: "Receba atualizações no seu e-mail", key: "emailNotif" },
          { label: "Notificações por SMS", desc: "Alertas urgentes via mensagem de texto", key: "smsNotif" },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
            <div><p className="text-sm font-medium text-slate-800">{item.label}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
            <label className="relative cursor-pointer">
              <input type="checkbox" className="sr-only" checked={!!(form as Record<string, unknown>)[item.key]} onChange={e => set(item.key as keyof AppSettings, e.target.checked)} />
              <div className={`w-10 h-5 rounded-full transition-colors ${(form as Record<string, unknown>)[item.key] ? "" : "bg-slate-200"}`} style={(form as Record<string, unknown>)[item.key] ? { background: "#2563EB" } : {}}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${(form as Record<string, unknown>)[item.key] ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`} />
              </div>
            </label>
          </div>
        ))}
      </Section>

      <Section title="Alterar Senha">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ label: "Senha atual", key: "current" }, { label: "Nova senha", key: "next" }, { label: "Confirmar senha", key: "confirm" }].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={(pwForm as Record<string, string>)[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPw ? <EyeOff size={13} /> : <Eye size={13} />}</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={changePassword} className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Lock size={14} />Alterar Senha</button>
      </Section>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button onClick={cancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={restore} className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"><RotateCcw size={14} />Restaurar padrão</button>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg disabled:opacity-70 transition-colors" style={{ background: "#2563EB" }}>
          {saving ? <Spinner /> : <Save size={14} />}{saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}

// ─── Admin ────────────────────────────────────────────────────────────────────
function AdminView() {
  const [users, setUsers] = useLocalStorage<AdminUser[]>("adminUsers", SEED_ADMIN_USERS);
  const [activeTab, setActiveTab] = useState("users");
  const [userModal, setUserModal] = useState<AdminUser | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "Colaborador", active: true });
  const [confirmDel, setConfirmDel] = useState<AdminUser | null>(null);
  const tabs = [{ id: "users", label: "Usuários" }, { id: "permissions", label: "Permissões" }, { id: "logs", label: "Logs" }, { id: "backup", label: "Backup" }];
  const roles = ["Administrador", "Gestor", "Colaborador", "Leitura"];
  const logs = [
    { time: "09:12", user: "Carlos Alves", action: "Login no sistema", type: "info" },
    { time: "09:25", user: "Rafaela Mendonça", action: "Exportou relatório de colaboradores", type: "info" },
    { time: "09:41", user: "Carlos Alves", action: "Criou colaborador: Isabela Costa", type: "success" },
    { time: "10:03", user: "Ana Costa", action: "Editou perfil de Lucas Ferreira", type: "info" },
    { time: "10:15", user: "Sistema", action: "Backup automático concluído", type: "success" },
    { time: "11:02", user: "Carlos Alves", action: "Tentativa de login inválida detectada", type: "warning" },
  ];

  function saveUser() {
    if (!userForm.name || !userForm.email) { toast.error("Preencha todos os campos"); return; }
    if (!validateEmail(userForm.email)) { toast.error("E-mail inválido"); return; }
    if (isNewUser) {
      setUsers(prev => [...prev, { ...userForm, id: nextId(users), lastLogin: "Nunca" }]);
      toast.success(`Usuário ${userForm.name} criado`);
    } else if (userModal) {
      setUsers(prev => prev.map(u => u.id === userModal.id ? { ...u, ...userForm } : u));
      toast.success("Usuário atualizado");
    }
    setUserModal(null);
  }

  function toggleUser(u: AdminUser) {
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !x.active } : x));
    toast.success(u.active ? `${u.name} desativado` : `${u.name} ativado`);
  }

  function deleteUser(u: AdminUser) { setUsers(prev => prev.filter(x => x.id !== u.id)); toast.success(`${u.name} removido`); setConfirmDel(null); }

  async function doBackup() {
    const data = { employees: JSON.parse(localStorage.getItem("employees") || "[]"), evaluations: JSON.parse(localStorage.getItem("evaluations") || "[]"), competencies: JSON.parse(localStorage.getItem("competencies") || "[]"), timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `talentflow-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success("Backup exportado com sucesso");
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <ConfirmDialog open={!!confirmDel} title="Remover usuário" message={`Remover "${confirmDel?.name}" do sistema?`} confirmLabel="Remover" danger onConfirm={() => confirmDel && deleteUser(confirmDel)} onCancel={() => setConfirmDel(null)} />
      <Modal open={!!userModal} title={isNewUser ? "Novo Usuário" : "Editar Usuário"} onClose={() => setUserModal(null)}>
        <div className="space-y-4">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label><input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">E-mail *</label><input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Perfil</label><div className="relative"><select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none">{roles.map(r => <option key={r}>{r}</option>)}</select><ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={userForm.active} onChange={e => setUserForm(f => ({ ...f, active: e.target.checked }))} /><span className="text-sm text-slate-700">Usuário ativo</span></label>
          <div className="flex gap-2 justify-end pt-2"><button onClick={() => setUserModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button><button onClick={saveUser} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}>Salvar</button></div>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Administração</h1><p className="text-sm text-slate-500 mt-0.5">Gestão de usuários, permissões e sistema</p></div>
      </div>

      <div className="flex border-b border-slate-200 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === "users" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setUserForm({ name: "", email: "", role: "Colaborador", active: true }); setIsNewUser(true); setUserModal({ id: 0, name: "", email: "", role: "Colaborador", active: true, lastLogin: "" }); }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Plus size={14} />Novo Usuário</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">{["Usuário", "E-mail", "Perfil", "Status", "Último acesso", ""].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">{h}</th>)}</tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><AvatarEl name={u.name} size="sm" /><span className="text-sm font-medium text-slate-800">{u.name}</span></div></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant={u.role === "Administrador" ? "error" : u.role === "Gestor" ? "primary" : "gray"}>{u.role}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={u.active ? "success" : "gray"}>{u.active ? "Ativo" : "Inativo"}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{u.lastLogin}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setUserForm({ name: u.name, email: u.email, role: u.role, active: u.active }); setIsNewUser(false); setUserModal(u); }} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => toggleUser(u)} className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${u.active ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-green-600 hover:bg-green-50"}`}>{u.active ? <Ban size={13} /> : <Check size={13} />}</button>
                        <button onClick={() => setConfirmDel(u)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-sm text-slate-500 mb-4">Controle de acesso por módulo e perfil</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100"><th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Módulo</th>{roles.map(r => <th key={r} className="text-center px-3 py-2 text-xs font-semibold text-slate-500">{r}</th>)}</tr></thead>
              <tbody>
                {["Dashboard", "Colaboradores", "Avaliações", "Competências", "Relatórios", "Configurações", "Administração"].map(mod => (
                  <tr key={mod} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-sm text-slate-700">{mod}</td>
                    {roles.map(role => {
                      const access = !(mod === "Administração" && role !== "Administrador") && !(mod === "Configurações" && role === "Leitura");
                      return (
                        <td key={role} className="px-3 py-2.5 text-center">
                          <input type="checkbox" defaultChecked={access} onChange={() => toast.info(`Permissão ${mod}/${role} atualizada`)} className="rounded" />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4"><button onClick={() => toast.success("Permissões salvas")} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}>Salvar Permissões</button></div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Log de Atividades — Hoje</h3>
            <button onClick={() => downloadCSV(logs.map(l => ({ Hora: l.time, Usuário: l.user, Ação: l.action })), "logs.csv")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"><Download size={12} />Exportar</button>
          </div>
          <div className="divide-y divide-slate-50">
            {logs.map((log, i) => {
              const colors: Record<string, string> = { info: "#0EA5E9", success: "#16A34A", warning: "#D97706", error: "#DC2626" };
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5 w-10 shrink-0">{log.time}</span>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: colors[log.type] }} />
                  <div><span className="text-xs font-medium text-slate-700">{log.user}</span><span className="text-xs text-slate-500"> · {log.action}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "backup" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Backup manual</h3>
            <p className="text-xs text-slate-500 mb-4">Exporte todos os dados do sistema em formato JSON.</p>
            <button onClick={doBackup} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Download size={14} />Exportar Backup</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Restaurar dados</h3>
            <p className="text-xs text-slate-500 mb-4">Restaure a partir de um arquivo de backup JSON.</p>
            <label className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer w-fit transition-colors">
              <Upload size={14} />Selecionar arquivo
              <input type="file" accept=".json" className="hidden" onChange={() => toast.success("Dados restaurados com sucesso")} />
            </label>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-5">
            <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={15} />Zona de perigo</h3>
            <p className="text-xs text-slate-500 mb-4">Ações irreversíveis. Use com cuidado.</p>
            <button onClick={() => toast.error("Ação bloqueada. Contacte o suporte para redefinição completa.")} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">Limpar todos os dados</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recruitment Placeholder ──────────────────────────────────────────────────
function RecruitmentView({ vacancies, setVacancies }: { vacancies: RecruitmentVacancy[]; setVacancies: RecruitmentVacancySetter }) {
  const pipelineStages = ["Aberta", "Triagem", "Entrevista", "Proposta", "Contratado"];

  const [loading, setLoading] = useState(true);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draggedCandidateId, setDraggedCandidateId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", dept: "Engenharia", priority: "Alta", status: "Aberta", description: "" });

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 800);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedVacancy = vacancies.find(v => v.id === selectedVacancyId) ?? null;
  const openVacanciesCount = vacancies.filter(v => v.status !== "Fechada").length;

  function openVacancyDetails(vacancy: RecruitmentVacancy) {
    setSelectedVacancyId(vacancy.id);
    toast.success(`Visualizando candidatos de “${vacancy.title}”`);
  }

  function closeVacancy(vacancy: RecruitmentVacancy) {
    if (vacancy.status === "Fechada") {
      notifyAlert(`A vaga “${vacancy.title}” já está encerrada.`);
      return;
    }
    setVacancies(prev => prev.map(item => item.id === vacancy.id ? { ...item, status: "Fechada" } : item));
    notifySuccess(`Vaga “${vacancy.title}” encerrada com sucesso`);
  }

  function moveCandidate(vacancyId: number, candidateId: number, nextStage: string) {
    if (!candidateId) {
      notifyAlert("Selecione um candidato antes de mover.");
      return;
    }
    setVacancies(prev => prev.map(vacancy => {
      if (vacancy.id !== vacancyId) return vacancy;

      const nextApplicants = vacancy.applicants.map(candidate => {
        if (candidate.id !== candidateId) return candidate;
        return { ...candidate, stage: nextStage };
      });

      return { ...vacancy, applicants: nextApplicants, candidates: nextApplicants.length };
    }));
    notifySuccess("Candidato movido para a etapa selecionada");
  }

  function openNewVacancyForm() {
    setShowForm(true);
    setForm({ title: "", dept: "Engenharia", priority: "Alta", status: "Aberta", description: "" });
    notifyAlert("Preencha os dados da nova vaga");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim()) {
      notifyError("Informe o título da vaga");
      return;
    }

    const newVacancy: RecruitmentVacancy = {
      id: Date.now(),
      title: form.title.trim(),
      dept: form.dept,
      candidates: 0,
      status: form.status,
      priority: form.priority,
      description: form.description.trim() || "Nova abertura em processo de contratação.",
      applicants: [],
    };

    setVacancies(prev => [newVacancy, ...prev]);
    setShowForm(false);
    setSelectedVacancyId(newVacancy.id);
    notifySuccess(`Vaga “${newVacancy.title}” criada com sucesso`);
  }

  function cancelNewVacancyForm() {
    setShowForm(false);
    notifyAlert("Criação de vaga cancelada");
  }

  function getStatusVariant(status: string) {
    if (status === "Fechada") return "gray";
    if (status === "Em Entrevista") return "warning";
    if (status === "Proposta") return "success";
    return "primary";
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recrutamento</h1>
          <p className="text-sm text-slate-500 mt-0.5">{openVacanciesCount} vagas abertas</p>
        </div>
        <button onClick={openNewVacancyForm} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Plus size={15} />Nova Vaga</button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-100 bg-white p-4">
              <div className="h-4 w-40 bg-slate-200 rounded mb-3" />
              <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : showForm ? (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Nova vaga</h2>
              <p className="text-sm text-slate-500">Cadastre uma nova abertura de contratação</p>
            </div>
            <button onClick={cancelNewVacancyForm} className="text-sm text-slate-500 hover:text-slate-700">Cancelar</button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600 md:col-span-2">
              <span className="mb-1 block">Título da vaga</span>
              <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500" placeholder="Ex.: Engenheiro Frontend Pleno" />
            </label>
            <label className="text-sm text-slate-600">
              <span className="mb-1 block">Departamento</span>
              <select value={form.dept} onChange={e => setForm(prev => ({ ...prev, dept: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option>Engenharia</option>
                <option>Produto</option>
                <option>Analytics</option>
                <option>Design</option>
                <option>Comercial</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              <span className="mb-1 block">Prioridade</span>
              <select value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option>Alta</option>
                <option>Média</option>
                <option>Baixa</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              <span className="mb-1 block">Status inicial</span>
              <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option>Aberta</option>
                <option>Em Entrevista</option>
                <option>Proposta</option>
              </select>
            </label>
            <label className="text-sm text-slate-600 md:col-span-2">
              <span className="mb-1 block">Descrição</span>
              <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className="w-full min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Descreva as responsabilidades e requisitos da vaga" />
            </label>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={cancelNewVacancyForm} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm rounded-lg text-white" style={{ background: "#2563EB" }}>Salvar vaga</button>
            </div>
          </form>
        </div>
      ) : selectedVacancy ? (
        <div className="space-y-4">
          <button onClick={() => setSelectedVacancyId(null)} className="text-sm text-slate-500 hover:text-slate-700">← Voltar para vagas</button>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedVacancy.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedVacancy.dept} · {selectedVacancy.candidates} candidatos</p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge p={selectedVacancy.priority} />
                <Badge variant={getStatusVariant(selectedVacancy.status)}>{selectedVacancy.status}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">{selectedVacancy.description}</p>
            <div className="mt-4 flex gap-2">
              {selectedVacancy.status !== "Fechada" && (
                <button onClick={() => closeVacancy(selectedVacancy)} className="px-3 py-1.5 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors">Encerrar vaga</button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Pipeline de candidatos</h3>
              <span className="text-xs text-slate-500">Arraste o fluxo entre etapas</span>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {pipelineStages.map(stage => {
                const stageCandidates = selectedVacancy.applicants.filter(candidate => candidate.stage === stage);
                return (
                  <div
                    key={stage}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 min-h-[180px]"
                    onDragOver={event => event.preventDefault()}
                    onDrop={() => {
                      if (draggedCandidateId) {
                        moveCandidate(selectedVacancy.id, draggedCandidateId, stage);
                        setDraggedCandidateId(null);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-800">{stage}</h4>
                      <span className="text-xs text-slate-500">{stageCandidates.length}</span>
                    </div>
                    <div className="space-y-2">
                      {stageCandidates.length > 0 ? stageCandidates.map(candidate => (
                        <div
                          key={candidate.id}
                          draggable
                          onDragStart={() => setDraggedCandidateId(candidate.id)}
                          onDragEnd={() => setDraggedCandidateId(null)}
                          className="rounded-lg border border-slate-200 bg-white p-2 cursor-grab"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{candidate.name}</p>
                              <p className="text-xs text-slate-500">{candidate.score}%</p>
                            </div>
                          </div>
                        </div>
                      )) : <p className="text-xs text-slate-400">Nenhum candidato nesta etapa ainda.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Lista de candidatos</h3>
              <span className="text-xs text-slate-500">{selectedVacancy.applicants.length} inscritos</span>
            </div>
            {selectedVacancy.applicants.length > 0 ? (
              <div className="space-y-2">
                {selectedVacancy.applicants.map(candidate => (
                  <div key={candidate.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{candidate.name}</p>
                      <p className="text-xs text-slate-500">{candidate.stage}</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{candidate.score}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Nenhum candidato cadastrado para esta vaga ainda. Acompanhe o processo e adicione novos perfis quando houver interesse.
              </div>
            )}
          </div>
        </div>
      ) : vacancies.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <EmptyState
            icon={Briefcase}
            title="Ainda não há vagas cadastradas"
            desc="Crie a primeira vaga para começar a acompanhar candidatos e etapas do processo."
            action="Nova vaga"
            onAction={openNewVacancyForm}
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {vacancies.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}><Briefcase size={18} style={{ color: "#2563EB" }} /></div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900">{v.title}</h3>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span>{v.dept}</span>
                  <span><Users size={11} className="inline mr-1" />{v.candidates} candidatos</span>
                </div>
              </div>
              <PriorityBadge p={v.priority} />
              <Badge variant={getStatusVariant(v.status)}>{v.status}</Badge>
              <div className="flex gap-1">
                <button onClick={() => openVacancyDetails(v)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Ver candidatos</button>
                {v.status !== "Fechada" && (
                  <button onClick={() => closeVacancy(v)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors">Encerrar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Goals View ───────────────────────────────────────────────────────────────
function GoalsView({ employees }: { employees: Employee[] }) {
  const goals = [
    { id: 1, title: "Aumentar NPS em 15 pontos", owner: "Rafaela Mendonça", progress: 68, deadline: "Mar 2025", status: "Em andamento" },
    { id: 2, title: "Reduzir turnover para <3%", owner: "Camila Rodrigues", progress: 55, deadline: "Dez 2025", status: "Em andamento" },
    { id: 3, title: "Implementar 360° para todos os gestores", owner: "Carlos Alves", progress: 90, deadline: "Jan 2025", status: "Em andamento" },
    { id: 4, title: "Treinamento de liderança Q1", owner: "Ana Costa", progress: 100, deadline: "Mar 2025", status: "Concluída" },
  ];
  return (
    <div className="p-6 max-w-[1200px]">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Metas & OKRs</h1><p className="text-sm text-slate-500 mt-0.5">{goals.filter(g => g.status !== "Concluída").length} metas ativas</p></div>
        <button onClick={() => toast.info("Criando nova meta...")} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Plus size={15} />Nova Meta</button>
      </div>
      <div className="space-y-3">
        {goals.map(g => (
          <div key={g.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><Badge variant={g.status === "Concluída" ? "success" : "primary"}>{g.status}</Badge></div>
                <h3 className="text-sm font-semibold text-slate-900">{g.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span><User size={11} className="inline mr-1" />{g.owner}</span>
                  <span><Calendar size={11} className="inline mr-1" />Prazo: {g.deadline}</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${g.progress}%`, background: g.progress >= 80 ? "#16A34A" : g.progress >= 50 ? "#2563EB" : "#D97706" }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{g.progress}%</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toast.info(`Editando "${g.title}"`)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => toast.success(`Meta "${g.title}" concluída!`)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"><Check size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Training View ────────────────────────────────────────────────────────────
function TrainingView() {
  const trainings = [
    { id: 1, title: "Cloud Architecture — AWS", instructor: "AWS Academy", enrolled: 12, completed: 8, duration: "40h", status: "Ativo" },
    { id: 2, title: "Leadership Foundations", instructor: "FDC", enrolled: 24, completed: 18, duration: "20h", status: "Ativo" },
    { id: 3, title: "Agile & Scrum Practitioner", instructor: "Scrum Alliance", enrolled: 30, completed: 30, duration: "16h", status: "Concluído" },
    { id: 4, title: "LGPD na Prática", instructor: "ANPD", enrolled: 45, completed: 10, duration: "8h", status: "Ativo" },
  ];
  return (
    <div className="p-6 max-w-[1200px]">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Treinamentos</h1><p className="text-sm text-slate-500 mt-0.5">{trainings.filter(t => t.status === "Ativo").length} ativos</p></div>
        <button onClick={() => toast.info("Criando novo treinamento...")} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ background: "#2563EB" }}><Plus size={15} />Novo Treinamento</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainings.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <Badge variant={t.status === "Ativo" ? "primary" : "success"}>{t.status}</Badge>
              <span className="text-xs text-slate-400">{t.duration}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">{t.title}</h3>
            <p className="text-xs text-slate-500 mb-3">Instrutor: {t.instructor}</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(t.completed / t.enrolled) * 100}%`, background: "#16A34A" }} />
              </div>
              <span className="text-xs text-slate-500">{t.completed}/{t.enrolled}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => toast.info(`Acessando ${t.title}`)} className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Ver detalhes</button>
              {t.status === "Ativo" && <button onClick={() => toast.success(`Inscrito em ${t.title}`)} className="flex-1 py-1.5 text-xs text-white rounded-lg transition-colors" style={{ background: "#2563EB" }}>Inscrever-se</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────
function AnalyticsView({ employees, period, setPeriod }: { employees: Employee[]; period: DashboardPeriod; setPeriod: (value: DashboardPeriod) => void }) {
  const periodFilteredEmployees = filterEmployeesByPeriod(employees, period);

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Analytics</h1><p className="text-sm text-slate-500 mt-0.5">Business Intelligence · {getPeriodLabel(period)}</p></div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {DASHBOARD_PERIODS.map(option => (
              <button key={option.value} onClick={() => setPeriod(option.value)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${period === option.value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {option.label}
              </button>
            ))}
          </div>
          <button onClick={() => toast.success("Dashboard atualizado")} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"><RefreshCw size={14} />Atualizar</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Performance ao longo do ano</h3>
          <ResponsiveContainer width="100%" height={220}><LineChart data={perf}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[60, 100]} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} /><Line type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} dot={false} name="Performance" /></LineChart></ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Headcount por Departamento</h3>
          <ResponsiveContainer width="100%" height={220}><BarChart data={deptData} barSize={22}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} /><XAxis dataKey="dept" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} /><Bar dataKey="count" fill="#16A34A" radius={[4, 4, 0, 0]} name="Headcount" /></BarChart></ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Score por colaborador</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={periodFilteredEmployees.map(e => ({ name: e.name.split(" ")[0], score: e.score }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="score" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Org Chart ────────────────────────────────────────────────────────────────
function OrgChartView({ employees }: { employees: Employee[] }) {
  const tree = [
    { name: "Carlos Alves", role: "CEO", reports: [
      { name: "Ana Costa", role: "COO", reports: [
        { name: "Camila Rodrigues", role: "HRBP", reports: [] },
        { name: "Eduardo Nascimento", role: "Sales Manager", reports: [] },
      ]},
      { name: "Pedro Lima", role: "CFO", reports: [
        { name: "Isabela Costa", role: "Finance Analyst", reports: [] },
        { name: "Thiago Oliveira", role: "Data Scientist", reports: [] },
      ]},
      { name: "Rafaela Mendonça", role: "Head of Product", reports: [
        { name: "Beatriz Santos", role: "UX Designer", reports: [] },
        { name: "Lucas Ferreira", role: "Senior Engineer", reports: [
          { name: "Gabriel Martins", role: "DevOps Engineer", reports: [] },
        ]},
      ]},
    ]},
  ];

  function OrgNode({ node, depth = 0 }: { node: typeof tree[0]; depth?: number }) {
    const [expanded, setExpanded] = useState(depth < 2);
    const emp = employees.find(e => e.name === node.name);
    return (
      <div className="flex flex-col items-center">
        <button onClick={() => { if (node.reports.length) setExpanded(!expanded); else toast.info(`Abrindo perfil de ${node.name}`); }}
          className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all cursor-pointer w-36 text-center">
          <AvatarEl name={node.name} size="md" photo={emp?.photo} />
          <span className="text-xs font-semibold text-slate-900 mt-2 leading-tight">{node.name.split(" ")[0]}</span>
          <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{node.role}</span>
          {node.reports.length > 0 && <span className="text-[10px] text-blue-500 mt-1">{expanded ? "▲" : "▼"} {node.reports.length}</span>}
        </button>
        {expanded && node.reports.length > 0 && (
          <div className="flex gap-6 mt-4 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-px bg-slate-200" style={{ top: -16 }} />
            {node.reports.map((child, i) => (
              <div key={i} className="flex flex-col items-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-px bg-slate-200" style={{ top: -16 }} />
                <OrgNode node={child as any} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px]">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Organograma</h1><p className="text-sm text-slate-500 mt-0.5">Estrutura hierárquica da organização</p></div>
        <button onClick={() => toast.info("Exportando organograma...")} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"><Download size={14} />Exportar</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 p-8 overflow-x-auto">
        <div className="flex justify-center min-w-max">
          {tree.map((node, i) => <OrgNode key={i} node={node as any} />)}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useLocalStorage<{ name: string; role: string; email: string } | null>("auth", null);
  const [active, setActive] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [employees, setEmployees] = useLocalStorage<Employee[]>("employees", SEED_EMPLOYEES);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>("notifications", SEED_NOTIFICATIONS);
  const [vacancies, setVacancies] = useLocalStorage<RecruitmentVacancy[]>("recruitment-vacancies", INITIAL_RECRUITMENT_VACANCIES);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>("mensal");
  const [formEmployee, setFormEmployee] = useState<Employee | null | undefined>(undefined);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
  }, []);

  function handleLogin(user: { name: string; role: string; email: string }) {
    setAuthed(user);
  }

  function handleLogout() {
    setAuthed(null);
    setActive("dashboard");
    setSelectedEmployee(null);
    setFormEmployee(undefined);
    setShowNewForm(false);
    toast.success("Sessão encerrada com sucesso");
  }

  function handleNav(id: string) {
    setActive(id);
    setSelectedEmployee(null);
    setFormEmployee(undefined);
    setShowNewForm(false);
  }

  function handleDashboardKpi(nav: string, metric: string, period: DashboardPeriod) {
    setDashboardPeriod(period);
    handleNav(nav);
    toast.success(`Abrindo ${metric === "total" ? "a lista de colaboradores" : metric === "turnover" ? "o relatório detalhado" : "a análise de desempenho"}`);
  }

  function handleSaveEmployee(emp: Employee) {
    if (formEmployee?.id) {
      setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
    } else {
      setEmployees(prev => [...prev, emp]);
    }
    setFormEmployee(undefined);
    setShowNewForm(false);
    setSelectedEmployee(null);
  }

  function renderMain() {
    if (showNewForm) {
      return (
        <EmployeeForm
          initial={formEmployee || undefined}
          employees={employees}
          onSave={emp => { handleSaveEmployee(emp); }}
          onCancel={() => { setShowNewForm(false); setFormEmployee(undefined); }}
          onSaveAnother={() => { setFormEmployee(undefined); setShowNewForm(true); }}
        />
      );
    }
    if (active === "employees" && selectedEmployee) {
      return (
        <EmployeeProfile
          employee={selectedEmployee}
          employees={employees}
          setEmployees={setEmployees}
          onBack={() => setSelectedEmployee(null)}
          onEdit={() => { setFormEmployee(selectedEmployee); setShowNewForm(true); }}
        />
      );
    }
    switch (active) {
      case "dashboard": return <Dashboard setActive={handleNav} employees={employees} period={dashboardPeriod} setPeriod={setDashboardPeriod} onKpiClick={handleDashboardKpi} />;
      case "employees": return <EmployeesView employees={employees} setEmployees={setEmployees} setActive={handleNav} onSelectProfile={e => { setSelectedEmployee(e); }} onNew={() => { setFormEmployee(undefined); setShowNewForm(true); }} onEdit={e => { setFormEmployee(e); setShowNewForm(true); }} period={dashboardPeriod} setPeriod={setDashboardPeriod} />;
      case "recruitment": return <RecruitmentView vacancies={vacancies} setVacancies={setVacancies} />;
      case "competencies": return <CompetenciesView />;
      case "evaluations": return <EvaluationsView employees={employees} />;
      case "goals": return <GoalsView employees={employees} />;
      case "kanban": return <KanbanView />;
      case "training": return <TrainingView />;
      case "certificates": return <CertificatesView employees={employees} />;
      case "reports": return <ReportsView employees={employees} period={dashboardPeriod} setPeriod={setDashboardPeriod} />;
      case "analytics": return <AnalyticsView employees={employees} period={dashboardPeriod} setPeriod={setDashboardPeriod} />;
      case "orgchart": return <OrgChartView employees={employees} />;
      case "settings": return <SettingsView dark={dark} setDark={setDark} />;
      case "admin": return <AdminView />;
      default: return null;
    }
  }

  if (!authed) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <PremiumLoginScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8FAFC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Toaster richColors position="top-right" />
      <Sidebar active={showNewForm ? "employees" : active} setActive={handleNav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} user={authed} onLogout={handleLogout} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar active={showNewForm ? "employees" : active} dark={dark} setDark={setDark} notifications={notifications} setNotifications={setNotifications} setActive={handleNav} user={authed} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          {renderMain()}
        </main>
      </div>
    </div>
  );
}
