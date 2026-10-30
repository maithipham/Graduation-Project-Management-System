import type { TemplateDocumentCategory, TemplateDocumentItem } from '../types/template.types'

export const TEMPLATE_DOCUMENT_TYPES: TemplateDocumentCategory[] = [
  'Mẫu báo cáo',
  'Phiếu đánh giá',
  'Quy chế',
  'Biên bản',
  'Mẫu đề cương',
]

export const TEMPLATE_DOCUMENTS_DATA: TemplateDocumentItem[] = [
  {
    id: 1,
    title: 'Mẫu báo cáo đồ án tốt nghiệp',
    extension: '.DOCX',
    type: 'Mẫu báo cáo',
    category: 'report',
    size: '1.2 MB',
    format: 'docx',
    iconColor: 'blue',
  },
  {
    id: 2,
    title: 'Phiếu đánh giá GVHD',
    extension: '.DOCX',
    type: 'Phiếu đánh giá',
    category: 'evaluation',
    size: '85 KB',
    format: 'docx',
    iconColor: 'blue',
  },
  {
    id: 3,
    title: 'Quy chế đồ án tốt nghiệp 2025',
    extension: '.PDF',
    type: 'Quy chế',
    category: 'regulation',
    size: '450 KB',
    format: 'pdf',
    iconColor: 'red',
  },
  {
    id: 4,
    title: 'Biên bản họp hội đồng',
    extension: '.DOCX',
    type: 'Biên bản',
    category: 'minutes',
    size: '92 KB',
    format: 'docx',
    iconColor: 'blue',
  },
  {
    id: 6,
    title: 'Mẫu đề cương chi tiết đồ án',
    extension: '.DOCX',
    type: 'Mẫu đề cương',
    category: 'outline',
    size: '140 KB',
    format: 'docx',
    iconColor: 'blue',
  },
  {
    id: 7,
    title: 'Phiếu nhận xét của Giảng viên Phản biện',
    extension: '.DOCX',
    type: 'Phiếu đánh giá',
    category: 'evaluation',
    size: '88 KB',
    format: 'docx',
    iconColor: 'blue',
  },
  {
    id: 8,
    title: 'Hướng dẫn kiểm tra đạo văn & trích dẫn IEEE',
    extension: '.PDF',
    type: 'Quy chế',
    category: 'regulation',
    size: '680 KB',
    format: 'pdf',
    iconColor: 'red',
  },
]



export const templateService = {
  getDocuments: (): TemplateDocumentItem[] => [...TEMPLATE_DOCUMENTS_DATA],
  getCategories: (): TemplateDocumentCategory[] => [...TEMPLATE_DOCUMENT_TYPES],
}
