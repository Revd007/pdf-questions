import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Compliance Checklist Tool untuk ISO 27001 dan PCI DSS
 * Membantu tracking progress compliance requirements
 */
export const complianceChecklistTool = createTool({
  id: 'compliance-checklist-tool',
  description: 'Mengambil checklist compliance requirements untuk ISO 27001 atau PCI DSS. Menampilkan list requirements yang perlu dipenuhi beserta status implementasinya.',
  inputSchema: z.object({
    standard: z.enum(['ISO27001', 'PCIDSS']).describe('Standar compliance: ISO27001 atau PCIDSS'),
    domain: z.string().optional().describe('Domain spesifik (misalnya: Access Control, Encryption, Network Security)'),
  }),
  outputSchema: z.object({
    standard: z.string(),
    domain: z.string().optional(),
    requirements: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
        status: z.enum(['Not Started', 'In Progress', 'Completed', 'Requires Review']).optional(),
      })
    ),
    totalRequirements: z.number(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { standard, domain } = context;

    // ISO 27001:2022 Domains (14 domains)
    const iso27001Requirements = {
      'Access Control': [
        { id: 'A.9.1', title: 'Business requirements of access control', category: 'Access Control', priority: 'High' },
        { id: 'A.9.2', title: 'User access management', category: 'Access Control', priority: 'Critical' },
        { id: 'A.9.3', title: 'User responsibilities', category: 'Access Control', priority: 'High' },
        { id: 'A.9.4', title: 'System and application access control', category: 'Access Control', priority: 'Critical' },
      ],
      'Cryptography': [
        { id: 'A.10.1', title: 'Cryptographic controls', category: 'Cryptography', priority: 'Critical' },
        { id: 'A.10.1.1', title: 'Policy on the use of cryptographic controls', category: 'Cryptography', priority: 'High' },
        { id: 'A.10.1.2', title: 'Key management', category: 'Cryptography', priority: 'Critical' },
      ],
      'Physical Security': [
        { id: 'A.11.1', title: 'Secure areas', category: 'Physical Security', priority: 'High' },
        { id: 'A.11.2', title: 'Equipment', category: 'Physical Security', priority: 'Medium' },
      ],
      'Network Security': [
        { id: 'A.9.4.4', title: 'Access control to program source code', category: 'Network Security', priority: 'High' },
        { id: 'A.13.1', title: 'Network security management', category: 'Network Security', priority: 'Critical' },
      ],
    };

    // PCI DSS v4.0 Requirements (12 requirements)
    const pciDssRequirements = {
      'Build and Maintain Secure Network': [
        { id: 'Req 1', title: 'Install and maintain network security controls', category: 'Network Security', priority: 'Critical' },
        { id: 'Req 2', title: 'Apply secure configurations to all system components', category: 'Configuration Management', priority: 'Critical' },
      ],
      'Protect Cardholder Data': [
        { id: 'Req 3', title: 'Protect stored cardholder data', category: 'Data Protection', priority: 'Critical' },
        { id: 'Req 4', title: 'Protect cardholder data with strong cryptography during transmission', category: 'Encryption', priority: 'Critical' },
      ],
      'Maintain Vulnerability Management': [
        { id: 'Req 5', title: 'Protect all systems and networks from malicious software', category: 'Anti-Malware', priority: 'Critical' },
        { id: 'Req 6', title: 'Develop and maintain secure systems and software', category: 'Secure Development', priority: 'High' },
      ],
      'Implement Strong Access Control': [
        { id: 'Req 7', title: 'Restrict access to cardholder data by business need to know', category: 'Access Control', priority: 'Critical' },
        { id: 'Req 8', title: 'Identify users and authenticate access to system components', category: 'Authentication', priority: 'Critical' },
        { id: 'Req 9', title: 'Restrict physical access to cardholder data', category: 'Physical Security', priority: 'High' },
      ],
      'Monitor and Test Networks': [
        { id: 'Req 10', title: 'Log and monitor all access to system components and cardholder data', category: 'Logging & Monitoring', priority: 'Critical' },
        { id: 'Req 11', title: 'Test security of systems and networks regularly', category: 'Testing', priority: 'High' },
      ],
      'Maintain Information Security Policy': [
        { id: 'Req 12', title: 'Support information security with organizational policies and programs', category: 'Policy', priority: 'High' },
      ],
    };

    const requirementsMap = standard === 'ISO27001' ? iso27001Requirements : pciDssRequirements;
    let allRequirements: any[] = [];

    if (domain) {
      // Filter by domain
      const domainKey = Object.keys(requirementsMap).find(
        key => key.toLowerCase().includes(domain.toLowerCase()) || domain.toLowerCase().includes(key.toLowerCase())
      );
      if (domainKey) {
        allRequirements = requirementsMap[domainKey as keyof typeof requirementsMap];
      } else {
        // If domain not found, return all
        allRequirements = Object.values(requirementsMap).flat();
      }
    } else {
      // Return all requirements
      allRequirements = Object.values(requirementsMap).flat();
    }

    const criticalCount = allRequirements.filter(r => r.priority === 'Critical').length;
    const highCount = allRequirements.filter(r => r.priority === 'High').length;

    return {
      standard,
      domain: domain || 'All',
      requirements: allRequirements.map(req => ({
        ...req,
        status: 'Not Started' as const, // Default status, bisa diupdate nanti
      })),
      totalRequirements: allRequirements.length,
      summary: `${standard} Compliance Checklist: ${allRequirements.length} requirements ditemukan. ${criticalCount} Critical, ${highCount} High priority. Gunakan tool ini untuk tracking progress compliance.`,
    };
  },
});

/**
 * Deadline Reminder Tool untuk tracking audit dates dan deadlines
 */
export const deadlineReminderTool = createTool({
  id: 'deadline-reminder-tool',
  description: 'Menampilkan deadline dan timeline penting untuk audit ISO 27001 atau PCI DSS. Menyimpan dan mengingatkan tentang milestone penting.',
  inputSchema: z.object({
    standard: z.enum(['ISO27001', 'PCIDSS', 'BOTH']).describe('Standar compliance yang ingin dicek deadline-nya'),
    action: z.enum(['list', 'add', 'check']).describe('Action: list semua deadlines, add deadline baru, atau check upcoming deadlines'),
    deadline: z.object({
      title: z.string(),
      date: z.string(),
      type: z.enum(['Audit', 'Compliance Review', 'Documentation', 'Training', 'Remediation']),
      priority: z.enum(['Critical', 'High', 'Medium']),
    }).optional().describe('Data deadline baru jika action = add'),
  }),
  outputSchema: z.object({
    deadlines: z.array(
      z.object({
        title: z.string(),
        date: z.string(),
        daysUntil: z.number(),
        type: z.string(),
        priority: z.string(),
        status: z.enum(['Upcoming', 'Due Soon', 'Overdue', 'Completed']),
      })
    ),
    summary: z.string(),
    actionTaken: z.string(),
  }),
  execute: async ({ context }) => {
    const { standard, action, deadline } = context;

    // Default deadlines untuk ISO 27001 dan PCI DSS
    const defaultDeadlines = [
      {
        title: 'ISO 27001: Initial Certification Audit',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        type: 'Audit',
        priority: 'Critical',
      },
      {
        title: 'PCI DSS: Annual Assessment',
        date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 180 days from now
        type: 'Audit',
        priority: 'Critical',
      },
      {
        title: 'Documentation Review',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        type: 'Documentation',
        priority: 'High',
      },
      {
        title: 'Staff Training Completion',
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days from now
        type: 'Training',
        priority: 'High',
      },
    ];

    let deadlines = defaultDeadlines;

    if (action === 'add' && deadline) {
      deadlines.push({
        title: deadline.title,
        date: deadline.date,
        type: deadline.type,
        priority: deadline.priority,
      });
    }

    // Filter by standard
    if (standard !== 'BOTH') {
      deadlines = deadlines.filter(d => {
        if (standard === 'ISO27001') return d.title.includes('ISO');
        if (standard === 'PCIDSS') return d.title.includes('PCI');
        return true;
      });
    }

    // Calculate days until and status
    const now = new Date();
    const deadlinesWithStatus = deadlines.map(d => {
      const deadlineDate = new Date(d.date);
      const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: 'Upcoming' | 'Due Soon' | 'Overdue' | 'Completed' = 'Upcoming';
      if (daysUntil < 0) status = 'Overdue';
      else if (daysUntil <= 7) status = 'Due Soon';
      else if (daysUntil <= 30) status = 'Due Soon';

      return {
        ...d,
        daysUntil,
        status,
      };
    });

    // Sort by priority and days until
    deadlinesWithStatus.sort((a, b) => {
      const priorityOrder = { Critical: 3, High: 2, Medium: 1 };
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                          (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.daysUntil - b.daysUntil;
    });

    const overdueCount = deadlinesWithStatus.filter(d => d.status === 'Overdue').length;
    const dueSoonCount = deadlinesWithStatus.filter(d => d.status === 'Due Soon').length;

    return {
      deadlines: deadlinesWithStatus,
      summary: `${deadlinesWithStatus.length} deadlines ditemukan. ${overdueCount} overdue, ${dueSoonCount} due soon (≤7 hari).`,
      actionTaken: action === 'add' 
        ? `Deadline baru ditambahkan: ${deadline?.title}` 
        : action === 'check'
        ? 'Checked upcoming deadlines'
        : 'Listed all deadlines',
    };
  },
});

/**
 * Gap Analysis Tool untuk mengidentifikasi gaps dalam compliance
 */
export const gapAnalysisTool = createTool({
  id: 'gap-analysis-tool',
  description: 'Melakukan gap analysis untuk mengidentifikasi area yang belum compliant dengan ISO 27001 atau PCI DSS. Menyediakan rekomendasi perbaikan.',
  inputSchema: z.object({
    standard: z.enum(['ISO27001', 'PCIDSS']).describe('Standar compliance yang akan dianalisis'),
    currentState: z.string().describe('Deskripsi kondisi saat ini atau area yang ingin dianalisis'),
    focusArea: z.string().optional().describe('Area spesifik yang ingin difokuskan (misalnya: Access Control, Encryption, Logging)'),
  }),
  outputSchema: z.object({
    standard: z.string(),
    focusArea: z.string().optional(),
    gaps: z.array(
      z.object({
        requirement: z.string(),
        gapDescription: z.string(),
        severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
        recommendation: z.string(),
        estimatedEffort: z.string(),
      })
    ),
    totalGaps: z.number(),
    criticalGaps: z.number(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { standard, currentState, focusArea } = context;

    // Sample gap analysis based on common compliance issues
    const commonGaps = {
      'Access Control': [
        {
          requirement: 'User Access Management',
          gapDescription: 'Tidak ada dokumentasi formal untuk user access provisioning dan deprovisioning',
          severity: 'Critical' as const,
          recommendation: 'Implementasikan access control policy dan procedure untuk user lifecycle management',
          estimatedEffort: '2-3 weeks',
        },
        {
          requirement: 'Privileged Access Control',
          gapDescription: 'Privileged accounts tidak ter-review secara berkala',
          severity: 'High' as const,
          recommendation: 'Setup quarterly review process untuk privileged access dengan dokumentasi',
          estimatedEffort: '1-2 weeks',
        },
      ],
      'Encryption': [
        {
          requirement: 'Data Encryption at Rest',
          gapDescription: 'Tidak semua cardholder data di-encrypt saat stored',
          severity: 'Critical' as const,
          recommendation: 'Implementasikan encryption untuk semua stored cardholder data dengan AES-256',
          estimatedEffort: '4-6 weeks',
        },
        {
          requirement: 'Data Encryption in Transit',
          gapDescription: 'Beberapa komunikasi masih menggunakan TLS 1.1 atau lebih rendah',
          severity: 'High' as const,
          recommendation: 'Upgrade semua komunikasi ke TLS 1.2 atau lebih tinggi',
          estimatedEffort: '2-3 weeks',
        },
      ],
      'Logging & Monitoring': [
        {
          requirement: 'Audit Logging',
          gapDescription: 'Log tidak di-retain selama minimum required period',
          severity: 'High' as const,
          recommendation: 'Setup log retention policy sesuai requirement (minimum 1 tahun)',
          estimatedEffort: '1-2 weeks',
        },
      ],
    };

    let gaps: any[] = [];

    if (focusArea) {
      const areaKey = Object.keys(commonGaps).find(
        key => key.toLowerCase().includes(focusArea.toLowerCase())
      );
      if (areaKey) {
        gaps = commonGaps[areaKey as keyof typeof commonGaps];
      } else {
        gaps = Object.values(commonGaps).flat();
      }
    } else {
      gaps = Object.values(commonGaps).flat();
    }

    // Add context-specific gaps based on currentState
    if (currentState.toLowerCase().includes('documentation') || currentState.toLowerCase().includes('policy')) {
      gaps.push({
        requirement: 'Information Security Policy',
        gapDescription: 'Policies dan procedures tidak terdokumentasi dengan lengkap',
        severity: 'High' as const,
        recommendation: 'Dokumentasikan semua policies dan procedures sesuai standar yang berlaku',
        estimatedEffort: '3-4 weeks',
      });
    }

    const criticalGaps = gaps.filter(g => g.severity === 'Critical').length;

    return {
      standard,
      focusArea: focusArea || 'All Areas',
      gaps,
      totalGaps: gaps.length,
      criticalGaps,
      summary: `Gap Analysis untuk ${standard}: ${gaps.length} gaps ditemukan dengan ${criticalGaps} critical gaps. Fokus pada critical gaps terlebih dahulu sebelum audit.`,
    };
  },
});

/**
 * Audit Preparation Tool untuk membantu persiapan audit
 */
export const auditPreparationTool = createTool({
  id: 'audit-preparation-tool',
  description: 'Menyediakan checklist dan guidance untuk persiapan audit ISO 27001 atau PCI DSS. Menyusun dokumen yang diperlukan dan action items.',
  inputSchema: z.object({
    standard: z.enum(['ISO27001', 'PCIDSS']).describe('Standar audit yang akan dipersiapkan'),
    auditType: z.enum(['Initial', 'Surveillance', 'Recertification', 'Annual']).describe('Tipe audit'),
    daysUntilAudit: z.number().optional().describe('Hari hingga audit (untuk timeline planning)'),
  }),
  outputSchema: z.object({
    standard: z.string(),
    auditType: z.string(),
    documentsRequired: z.array(
      z.object({
        documentName: z.string(),
        category: z.string(),
        priority: z.enum(['Must Have', 'Should Have', 'Nice to Have']),
        status: z.string().optional(),
      })
    ),
    actionItems: z.array(
      z.object({
        task: z.string(),
        priority: z.string(),
        timeline: z.string(),
      })
    ),
    tips: z.array(z.string()),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { standard, auditType, daysUntilAudit = 30 } = context;

    const documentsRequired = standard === 'ISO27001' ? [
      { documentName: 'Information Security Policy', category: 'Policy', priority: 'Must Have' as const },
      { documentName: 'Risk Assessment Report', category: 'Assessment', priority: 'Must Have' as const },
      { documentName: 'Risk Treatment Plan', category: 'Assessment', priority: 'Must Have' as const },
      { documentName: 'Statement of Applicability (SOA)', category: 'Documentation', priority: 'Must Have' as const },
      { documentName: 'Internal Audit Report', category: 'Audit', priority: 'Must Have' as const },
      { documentName: 'Management Review Records', category: 'Management', priority: 'Must Have' as const },
      { documentName: 'Access Control Procedures', category: 'Procedure', priority: 'Should Have' as const },
      { documentName: 'Incident Response Plan', category: 'Procedure', priority: 'Should Have' as const },
      { documentName: 'Business Continuity Plan', category: 'Procedure', priority: 'Should Have' as const },
    ] : [
      { documentName: 'Network Diagram', category: 'Network', priority: 'Must Have' as const },
      { documentName: 'Data Flow Diagram', category: 'Network', priority: 'Must Have' as const },
      { documentName: 'Cardholder Data Environment (CDE) Scope', category: 'Scope', priority: 'Must Have' as const },
      { documentName: 'Encryption Key Management Procedures', category: 'Procedure', priority: 'Must Have' as const },
      { documentName: 'Vulnerability Scan Reports', category: 'Testing', priority: 'Must Have' as const },
      { documentName: 'Penetration Test Report', category: 'Testing', priority: 'Must Have' as const },
      { documentName: 'Access Control Matrix', category: 'Access Control', priority: 'Must Have' as const },
      { documentName: 'Firewall Rule Review', category: 'Network', priority: 'Should Have' as const },
      { documentName: 'Log Review Procedures', category: 'Procedure', priority: 'Should Have' as const },
    ];

    const actionItems = [
      { task: 'Review semua dokumentasi yang diperlukan', priority: 'Critical', timeline: 'Week 1-2' },
      { task: 'Lakukan internal audit atau gap analysis', priority: 'Critical', timeline: 'Week 2-3' },
      { task: 'Remediasi gaps yang ditemukan', priority: 'High', timeline: 'Week 3-4' },
      { task: 'Persiapkan evidence untuk setiap requirement', priority: 'High', timeline: 'Week 4' },
      { task: 'Briefing tim untuk audit', priority: 'Medium', timeline: 'Week 4' },
    ];

    const tips = [
      'Pastikan semua dokumentasi up-to-date dan accessible',
      'Siapkan evidence untuk setiap control yang diimplementasikan',
      'Lakukan dry-run dengan internal audit sebelum external audit',
      'Pastikan semua tim aware tentang audit schedule dan expectations',
      'Siapkan area khusus untuk auditor dengan akses ke dokumentasi yang diperlukan',
    ];

    return {
      standard,
      auditType,
      documentsRequired,
      actionItems,
      tips,
      summary: `Audit Preparation untuk ${standard} ${auditType} Audit: ${documentsRequired.filter(d => d.priority === 'Must Have').length} dokumen wajib perlu disiapkan. ${daysUntilAudit} hari tersisa. Fokus pada action items critical terlebih dahulu.`,
    };
  },
});

