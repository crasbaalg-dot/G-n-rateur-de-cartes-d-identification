/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  RefreshCw, 
  Upload, 
  CreditCard, 
  User, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  LayoutTemplate, 
  Plus, 
  Trash2, 
  Download, 
  Table,
  Droplet,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import Papa from 'papaparse';

// --- الثوابت والبيانات ---
const WILAYAS = [
  { id: '01', name: 'أدرار' }, { id: '02', name: 'الشلف' }, { id: '03', name: 'الأغواط' }, { id: '04', name: 'أم البواقي' },
  { id: '05', name: 'باتنة' }, { id: '06', name: 'بجاية' }, { id: '07', name: 'بسكرة' }, { id: '08', name: 'بشار' },
  { id: '09', name: 'البليدة' }, { id: '10', name: 'البويرة' }, { id: '11', name: 'تمنراست' }, { id: '12', name: 'تبسة' },
  { id: '13', name: 'تلمسان' }, { id: '14', name: 'تيارت' }, { id: '15', name: 'تيزي وزو' }, { id: '16', name: 'الجزائر' },
  { id: '17', name: 'الجلفة' }, { id: '18', name: 'جيجل' }, { id: '19', name: 'سطيف' }, { id: '20', name: 'سعيدة' },
  { id: '21', name: 'سكيكدة' }, { id: '22', name: 'سيدي بلعباس' }, { id: '23', name: 'عنابة' }, { id: '24', name: 'قالمة' },
  { id: '25', name: 'قسنطينة' }, { id: '26', name: 'المدية' }, { id: '27', name: 'مستغانم' }, { id: '28', name: 'المسيلة' },
  { id: '29', name: 'معسكر' }, { id: '30', name: 'ورقلة' }, { id: '31', name: 'وهران' }, { id: '32', name: 'البيض' },
  { id: '33', name: 'إيليزي' }, { id: '34', name: 'برج بوعريريج' }, { id: '35', name: 'بومرداس' }, { id: '36', name: 'الطارف' },
  { id: '37', name: 'تندوف' }, { id: '38', name: 'تسمسيلت' }, { id: '39', name: 'الوادي' }, { id: '40', name: 'خنشلة' },
  { id: '41', name: 'سوق أهراس' }, { id: '42', name: 'تيبازة' }, { id: '43', name: 'ميلة' }, { id: '44', name: 'عين الدفلى' },
  { id: '45', name: 'النعامة' }, { id: '46', name: 'عين تموشنت' }, { id: '47', name: 'غرداية' }, { id: '48', name: 'غليزان' },
  { id: '49', name: 'تيميمون' }, { id: '50', name: 'برج باجي مختار' }, { id: '51', name: 'أولاد جلال' }, { id: '52', name: 'بني عباس' },
  { id: '53', name: 'عين صالح' }, { id: '54', name: 'عين قزام' }, { id: '55', name: 'تقرت' }, { id: '56', name: 'جانت' },
  { id: '57', name: 'المغير' }, { id: '58', name: 'المنيعة' }
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CELLS = [
  'الدعم النفسي',
  'الإسعافات الأولية',
  'ذوي الهمم',
  'القانون',
  'الطلبة والشباب',
  'المتطوعين',
  'الإعلام والاتصال',
  'التضامن',
  'التكنولوجيا',
  'الطبية',
  'التدخل والإنقاذ',
  'التوعية والتحسيس',
  'الصحة',
  'البيئة'
];

const CARD_SIZES = {
  standard: { id: 'standard', name: 'الحجم القياسي (CR80)', width: '85.6mm', height: '54mm', isVertical: false },
  biometric: { id: 'biometric', name: 'الحجم البيومتري', width: '85.6mm', height: '53.98mm', isVertical: false },
  standardVertical: { id: 'standardVertical', name: 'الحجم القياسي عمودي', width: '54mm', height: '85.6mm', isVertical: true },
};

const CRA_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Algerian_Red_Crescent_logo.svg';

interface VolunteerData {
  firstNameAr: string;
  lastNameAr: string;
  firstNameFr: string;
  lastNameFr: string;
  role: string;
  cellName: string;
  birthDate: string;
  birthPlace: string;
  bloodType: string;
  wilaya: string;
  volunteerId: string;
  photoUrl: string | null;
  attributes: string[];
}

export default function App() {
  const [formData, setFormData] = useState<VolunteerData>({
    firstNameAr: '',
    lastNameAr: '',
    firstNameFr: '',
    lastNameFr: '',
    role: '',
    cellName: '',
    birthDate: '',
    birthPlace: '',
    bloodType: '',
    wilaya: '',
    volunteerId: '',
    photoUrl: null,
    attributes: ['']
  });

  const [selectedSize, setSelectedSize] = useState(CARD_SIZES.standard);
  const [isGenerated, setIsGenerated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [bulkData, setBulkData] = useState<VolunteerData[]>([]);
  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
  const combinedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "CRA Cartes d'Identité Générateur";
    // Set favicon
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    (link as HTMLLinkElement).type = 'image/svg+xml';
    (link as HTMLLinkElement).rel = 'shortcut icon';
    (link as HTMLLinkElement).href = CRA_LOGO;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  const [showInstructions, setShowInstructions] = useState(false);

  const [printingCard, setPrintingCard] = useState<VolunteerData | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttributeChange = (index: number, value: string) => {
    const newAttrs = [...formData.attributes];
    newAttrs[index] = value;
    setFormData(prev => ({ ...prev, attributes: newAttrs }));
  };

  const addAttribute = () => {
    if (formData.attributes.length < 5) {
      setFormData(prev => ({ ...prev, attributes: [...prev.attributes, ''] }));
    }
  };

  const removeAttribute = (index: number) => {
    const newAttrs = formData.attributes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, attributes: newAttrs.length ? newAttrs : [''] }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!formData.firstNameAr || !formData.lastNameAr || !formData.wilaya || !formData.volunteerId) {
      setErrorMsg('يرجى ملء الحقول الأساسية (الاسم، اللقب، الولاية، رقم المتطوع).');
      return;
    }
    setErrorMsg('');
    setIsGenerated(true);
    setViewMode('single');
  };

  const handleReset = () => {
    setFormData({
      firstNameAr: '', lastNameAr: '', firstNameFr: '', lastNameFr: '',
      role: '', cellName: '', birthDate: '', birthPlace: '', bloodType: '',
      wilaya: '', volunteerId: '', photoUrl: null, attributes: ['']
    });
    setIsGenerated(false);
    setErrorMsg('');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleIndividualPrint = (data: VolunteerData) => {
    setPrintingCard(data);
    setTimeout(() => {
      window.print();
      setPrintingCard(null);
    }, 100);
  };

  const exportAsImage = async (format: 'png' | 'jpeg', side: 'front' | 'back' | 'both' = 'front') => {
    if (!cardRef.current && side === 'front') return;
    if (!cardBackRef.current && side === 'back') return;
    if (!combinedRef.current && side === 'both') return;

    const targetRef = side === 'front' ? cardRef : (side === 'back' ? cardBackRef : combinedRef);
    if (!targetRef.current) return;

    try {
      const options = { 
        pixelRatio: 4, 
        quality: 1,
        backgroundColor: '#ffffff'
      };
      
      let dataUrl;
      if (format === 'png') {
        dataUrl = await htmlToImage.toPng(targetRef.current, options);
      } else {
        dataUrl = await htmlToImage.toJpeg(targetRef.current, options);
      }
      
      const link = document.createElement('a');
      link.download = `CRA-Card-${side}-${formData.lastNameAr}-${formData.firstNameAr}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const fetchGoogleSheet = async () => {
    if (!sheetUrl) return;
    setIsLoadingSheet(true);
    setErrorMsg('');

    try {
      let csvUrl = sheetUrl;
      // Handle different types of Google Sheets URLs
      if (sheetUrl.includes('/edit')) {
        // Standard edit URL
        csvUrl = sheetUrl.replace(/\/edit.*$/, '/export?format=csv');
      } else if (sheetUrl.includes('/pub') && sheetUrl.includes('output=csv')) {
        // Already a published CSV URL, leave it as is
        csvUrl = sheetUrl;
      } else if (!sheetUrl.includes('format=csv') && !sheetUrl.includes('output=csv')) {
        // Other URLs that might need the format parameter
        csvUrl += (sheetUrl.includes('?') ? '&' : '?') + 'format=csv';
      }

      Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            setErrorMsg('الجدول فارغ أو لم يتم التعرف على البيانات.');
            setIsLoadingSheet(false);
            return;
          }

          const findValue = (row: any, keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
              // Exact match
              if (row[key] !== undefined) return row[key];
              // Case-insensitive match
              const foundKey = rowKeys.find(rk => rk.toLowerCase().trim() === key.toLowerCase().trim());
              if (foundKey) return row[foundKey];
            }
            return '';
          };

          const parsedData = results.data.map((row: any) => {
            const wilayaValue = findValue(row, ['الولاية', 'اللجنة الولائية', 'Wilaya', 'الولاية (رقم أو اسم)']);
            // Try to find wilaya ID if name was provided
            let wilayaId = wilayaValue;
            const foundWilaya = WILAYAS.find(w => w.name === wilayaValue.trim() || w.id === wilayaValue.trim().padStart(2, '0'));
            if (foundWilaya) {
              wilayaId = foundWilaya.id;
            }

            const rawPhotoUrl = findValue(row, ['الصورة الشخصية', 'رابط الصورة', 'الصورة', 'Photo', 'Photo URL', 'PhotoURL'])?.toString().trim();
            let photoUrl = rawPhotoUrl;
            
            // Transform Google Drive links to direct viewable links
            if (rawPhotoUrl && (rawPhotoUrl.includes('drive.google.com') || rawPhotoUrl.includes('docs.google.com'))) {
              const fileIdMatch = rawPhotoUrl.match(/\/d\/([^/]+)/) || rawPhotoUrl.match(/id=([^&]+)/);
              if (fileIdMatch && fileIdMatch[1]) {
                photoUrl = `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
              }
            }

            return {
              firstNameAr: findValue(row, ['الاسم (عربي)', 'الاسم', 'الاسم بالعربية', 'First Name', 'FirstName']),
              lastNameAr: findValue(row, ['اللقب (عربي)', 'اللقب', 'اللقب بالعربية', 'Last Name', 'LastName']),
              firstNameFr: findValue(row, ['الاسم (فرنسي)', 'الاسم بالفرنسية', 'First Name FR', 'FirstNameFR']),
              lastNameFr: findValue(row, ['اللقب (فرنسي)', 'اللقب بالفرنسية', 'Last Name FR', 'LastNameFR']),
              role: findValue(row, ['الصفة', 'Role']),
              cellName: findValue(row, ['الخلية', 'Cell']),
              birthDate: findValue(row, ['تاريخ الميلاد', 'Birth Date', 'BirthDate']),
              birthPlace: findValue(row, ['مكان الميلاد', 'Birth Place', 'BirthPlace']),
              bloodType: findValue(row, ['الزمرة الدموية', 'الزمرة', 'Blood Type', 'BloodType']),
              wilaya: wilayaId,
              volunteerId: findValue(row, ['رقم المتطوع', 'ID', 'Volunteer ID', 'VolunteerID']),
              photoUrl: photoUrl,
              attributes: [
                findValue(row, ['الصفة 1', 'Attr 1']),
                findValue(row, ['الصفة 2', 'Attr 2']),
                findValue(row, ['الصفة 3', 'Attr 3']),
                findValue(row, ['الصفة 4', 'Attr 4']),
                findValue(row, ['الصفة 5', 'Attr 5'])
              ].filter(Boolean)
            };
          });
          
          const filteredData = parsedData.filter(d => d.firstNameAr || d.lastNameAr);
          
          if (filteredData.length === 0) {
            setErrorMsg('لم يتم العثور على بيانات صالحة. تأكد من أن أسماء الأعمدة مطابقة (الاسم، اللقب، إلخ).');
          } else {
            setBulkData(filteredData);
            setViewMode('bulk');
            setIsGenerated(true);
          }
          setIsLoadingSheet(false);
        },
        error: (err) => {
          setErrorMsg('فشل في جلب البيانات من الرابط. تأكد من أن الرابط صحيح والجدول متاح للجميع.');
          setIsLoadingSheet(false);
        }
      });
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء معالجة الرابط.');
      setIsLoadingSheet(false);
    }
  };

  const Card = ({ data, size, isBulk = false }: { data: VolunteerData, size: typeof CARD_SIZES.standard, isBulk?: boolean }) => {
    const selectedWilaya = WILAYAS.find(w => w.id === data.wilaya);
    const qrData = `CRA-${data.wilaya}-${data.volunteerId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&color=000000&bgcolor=ffffff`;

    const primaryAttribute = data.role === 'رئيس خلية' 
      ? `رئيس خلية ${data.cellName}` 
      : (data.attributes[0] || data.role);
    
    const otherAttributes = data.attributes.slice(data.role === 'رئيس خلية' ? 0 : 1).filter(a => a !== data.role && a !== data.cellName);

    const exportIndividual = async (format: 'png' | 'jpeg', side: 'front' | 'back' | 'both', refFront: any, refBack: any, refBoth: any) => {
      const targetRef = side === 'front' ? refFront : (side === 'back' ? refBack : refBoth);
      if (!targetRef.current) return;
      try {
        const options = { pixelRatio: 4, quality: 1, backgroundColor: '#ffffff' };
        const dataUrl = format === 'png' ? await htmlToImage.toPng(targetRef.current, options) : await htmlToImage.toJpeg(targetRef.current, options);
        const link = document.createElement('a');
        link.download = `CRA-Card-${data.lastNameAr}-${side}.${format}`;
        link.href = dataUrl;
        link.click();
      } catch (e) { console.error(e); }
    };

    const localFrontRef = useRef<HTMLDivElement>(null);
    const localBackRef = useRef<HTMLDivElement>(null);
    const localBothRef = useRef<HTMLDivElement>(null);

    return (
      <div className={`card-wrapper flex flex-col items-center ${isBulk ? 'mb-12 pb-12 border-b border-slate-200' : ''} ${printingCard && printingCard.volunteerId !== data.volunteerId ? 'print:hidden' : ''}`}>
        {/* Individual Actions (Bulk Mode Only) */}
        {isBulk && (
          <div className="flex gap-2 mb-4 no-print">
            <button onClick={() => handleIndividualPrint(data)} className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
              <Printer className="w-3.5 h-3.5" /> طباعة هذه البطاقة
            </button>
            <button onClick={() => exportIndividual('png', 'both', localFrontRef, localBackRef, localBothRef)} className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
              <ImageIcon className="w-3.5 h-3.5" /> تحميل الوجهين
            </button>
          </div>
        )}

        <div ref={isBulk ? localBothRef : combinedRef} className="flex flex-col gap-4 items-center bg-white p-2 rounded-xl">
          {/* Front Side */}
          <div 
            ref={isBulk ? localFrontRef : cardRef}
            className="card-container bg-white relative overflow-hidden rounded-[10px] shadow-2xl border border-gray-200 print:shadow-none print:border print:border-gray-300 shrink-0"
            style={{
              width: size.width, 
              height: size.height,
              boxSizing: 'border-box',
              backgroundImage: `url(${CRA_LOGO})`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '80%',
              backgroundColor: '#ffffff'
            }}
          >
            <div className="absolute inset-0 bg-white bg-opacity-94 z-0"></div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[40mm] h-[40mm] bg-red-600/5 rounded-full -mr-[20mm] -mt-[20mm] z-0"></div>
            <div className="absolute bottom-0 left-0 w-[30mm] h-[30mm] bg-red-600/5 rounded-full -ml-[15mm] -mb-[15mm] z-0"></div>

            <div className="absolute inset-0 z-10 flex flex-col p-[4mm]">
              {/* Header */}
              <div className="flex justify-between items-start mb-[2mm]">
                <div className="flex items-center gap-[3mm]">
                  <img src={CRA_LOGO} alt="CRA" className="h-[12mm] w-auto object-contain" />
                  <div className="flex flex-col items-start text-right">
                    <span className="text-[10px] font-black text-gray-900 leading-tight">الهلال الأحمر الجزائري</span>
                    <span className="text-[7.5px] font-bold text-gray-600 leading-tight font-fr" dir="ltr">Algerian Red Crescent</span>
                    <span className="text-[7.5px] font-bold text-gray-600 leading-tight font-fr" dir="ltr">Croissant-Rouge Algérien</span>
                  </div>
                </div>
                <div className="text-left border-r-2 border-red-600 pr-[2mm]">
                  <span className="text-[8px] font-bold text-gray-500 block">اللجنة الولائية</span>
                  <span className="text-[11px] font-black text-red-700 block">{selectedWilaya?.name || '..........'}</span>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex flex-1 gap-[4mm] items-start mt-[1mm]">
                {/* Photo Section */}
                <div className="flex flex-col gap-[2mm] shrink-0">
                  <div className="w-[26mm] h-[32mm] bg-white border-[0.5mm] border-red-600 rounded-[4px] overflow-hidden flex items-center justify-center relative shadow-md">
                    {data.photoUrl ? (
                      <img src={data.photoUrl} alt="Volunteer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="text-gray-100 w-12 h-12" />
                    )}
                  </div>
                </div>

                {/* Data Section */}
                <div className="flex-1 flex flex-col justify-between h-full py-[1mm] overflow-hidden">
                  <div className="space-y-[1.5mm]">
                    <div className="border-b-[0.3mm] border-red-100 pb-[1.5mm]">
                      <span className="text-[15px] font-black text-gray-900 block leading-tight truncate">
                        {data.lastNameAr} {data.firstNameAr}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 block leading-tight font-fr uppercase truncate mt-[0.5mm]">
                        {data.lastNameFr} {data.firstNameFr}
                      </span>
                    </div>

                    <div className="space-y-[1.5mm] mt-[2mm]">
                      <div className="flex items-center gap-[1.5mm] text-[8.5px] font-bold text-gray-800">
                        <Calendar className="w-[3mm] h-[3mm] text-red-600 shrink-0" />
                        <span className="truncate">تاريخ الميلاد: {data.birthDate || '..../../..'}</span>
                      </div>
                      <div className="flex items-center gap-[1.5mm] text-[8.5px] font-bold text-gray-800">
                        <MapPin className="w-[3mm] h-[3mm] text-red-600 shrink-0" />
                        <span className="truncate">مكان الميلاد: {data.birthPlace || '.......'}</span>
                      </div>
                      {data.bloodType && (
                        <div className="flex items-center gap-[1.5mm] text-[8.5px] font-bold text-gray-800">
                          <Droplet className="w-[3mm] h-[3mm] text-red-600 shrink-0" />
                          <span>الزمرة الدموية: <span className="text-red-700 font-black">{data.bloodType}</span></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role Box */}
                  <div className="mt-auto">
                    <div className="bg-red-600 text-white px-[3mm] py-[2mm] rounded-[3px] shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-white/10 -skew-x-12 transform translate-x-1/2"></div>
                      <span className="text-[11px] font-black block text-center relative z-10">
                        {primaryAttribute}
                      </span>
                    </div>
                    {otherAttributes.length > 0 && (
                      <div className="flex flex-wrap gap-[1mm] mt-[1.5mm]">
                        {otherAttributes.map((attr, i) => (
                          <span key={i} className="text-[7.5px] font-black text-red-700 bg-red-50 px-[2mm] py-[0.8mm] rounded-full border border-red-100 shadow-sm">
                            {attr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2mm] bg-red-600"></div>
            </div>
          </div>

          {/* Back Side */}
          <div 
            ref={isBulk ? localBackRef : cardBackRef}
            className="card-container bg-white relative overflow-hidden rounded-[10px] shadow-2xl border border-gray-200 print:shadow-none print:border print:border-gray-300 shrink-0"
            style={{
              width: size.width, 
              height: size.height,
              boxSizing: 'border-box',
              backgroundColor: '#ffffff'
            }}
          >
            <div className="absolute inset-0 z-10 flex flex-col p-[5mm]">
              <div className="text-center border-b border-gray-200 pb-[2mm] mb-[4mm]">
                <span className="text-[11px] font-black text-gray-900 block tracking-widest">بطاقة عضوية</span>
                <span className="text-[8px] font-bold text-gray-400 font-fr uppercase block mt-[0.5mm]" dir="ltr">Membership Identity Card</span>
              </div>
              
              <div className="flex flex-1 gap-[4mm] items-center">
                <div className="flex-1 space-y-[4mm]">
                  <div className="bg-gray-50 p-[3mm] rounded-lg border border-gray-100">
                    <span className="text-[7px] font-bold text-gray-400 block mb-[1mm]">رقم المتطوع / Volunteer ID</span>
                    <span className="text-[16px] font-black text-gray-900 block font-fr tracking-wider" dir="ltr">
                      {data.volunteerId}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-[3mm] rounded-lg border border-gray-100">
                    <span className="text-[7px] font-bold text-gray-400 block mb-[1mm]">اللجنة الولائية / Wilaya Committee</span>
                    <span className="text-[12px] font-black text-red-700 block">
                      {selectedWilaya?.id} - {selectedWilaya?.name}
                    </span>
                  </div>
                </div>
                
                <div className="w-[28mm] flex flex-col items-center justify-center shrink-0 bg-white p-[2mm] rounded-xl shadow-inner border border-gray-50">
                  <img src={qrCodeUrl} alt="QR Code" className="w-[22mm] h-[22mm]" />
                  <span className="text-[7px] font-black text-gray-400 mt-[2mm] font-fr tracking-tighter" dir="ltr">{qrData}</span>
                </div>
              </div>
              
              <div className="mt-auto pt-[3mm] border-t border-gray-100 flex justify-between items-end">
                 <div className="flex flex-col">
                   <span className="text-[6px] text-gray-400 font-bold">توقيع المسؤول</span>
                   <div className="w-[20mm] h-[8mm] border-b border-gray-200"></div>
                 </div>
                 <div className="text-right">
                   <span className="text-[6.5px] text-gray-400 font-bold block">هذه البطاقة ملك للهلال الأحمر الجزائري</span>
                   <span className="text-[6.5px] text-gray-400 font-bold block">يجب إعادتها في حال انتهاء المهام</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-red-100" dir="rtl">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800&display=swap');
        
        body { font-family: 'Cairo', sans-serif; }
        .font-fr { font-family: 'Inter', sans-serif; }
        
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #print-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .card-wrapper {
            page-break-inside: avoid;
            margin-bottom: 10mm;
            display: flex;
            justify-content: center;
          }
          .card-container {
            box-shadow: none !important;
            border: 0.2mm solid #eee !important;
          }
        }

        .animate-in {
          animation: slideIn 0.4s ease-out forwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-red-50 p-2 rounded-xl border border-red-100">
              <img src={CRA_LOGO} alt="CRA Logo" className="h-10 w-auto" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">منصة بطاقات الهلال الأحمر</h1>
              <p className="text-xs text-slate-500 font-medium">نظام التوليد والطباعة الاحترافي</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'single' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              بطاقة فردية
            </button>
            <button 
              onClick={() => setViewMode('bulk')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'bulk' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              طباعة جماعية
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6 no-print">
          {viewMode === 'single' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="text-red-600 w-5 h-5" />
                  <h2 className="text-base font-bold text-slate-800">بيانات المتطوع</h2>
                </div>
                <button onClick={handleReset} className="text-slate-400 hover:text-red-600 transition">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">الاسم (عربي)</label>
                    <input name="firstNameAr" value={formData.firstNameAr} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50" placeholder="أحمد" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">اللقب (عربي)</label>
                    <input name="lastNameAr" value={formData.lastNameAr} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50" placeholder="سليمان" />
                  </div>
                </div>

                {/* French Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">الاسم (فرنسي)</label>
                    <input name="firstNameFr" value={formData.firstNameFr} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition font-fr bg-slate-50/50" dir="ltr" placeholder="Ahmed" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">اللقب (فرنسي)</label>
                    <input name="lastNameFr" value={formData.lastNameFr} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition font-fr bg-slate-50/50" dir="ltr" placeholder="Slimane" />
                  </div>
                </div>

                {/* Role & Cell */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">الصفة</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50">
                      <option value="">اختر الصفة</option>
                      <option value="متطوع">متطوع</option>
                      <option value="مسعف">مسعف</option>
                      <option value="طبيب">طبيب</option>
                      <option value="رئيس خلية">رئيس خلية</option>
                      <option value="رئيس لجنة">رئيس لجنة</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">الخلية</label>
                    <select name="cellName" value={formData.cellName} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50">
                      <option value="">اختر الخلية</option>
                      {CELLS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Attributes (Up to 5) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500">الصفات الإضافية (بحد أقصى 5)</label>
                    <button 
                      onClick={addAttribute}
                      disabled={formData.attributes.length >= 5}
                      className="text-red-600 hover:bg-red-50 p-1 rounded-lg transition disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.attributes.map((attr, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          value={attr} 
                          onChange={(e) => handleAttributeChange(index, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:border-red-500 outline-none text-sm transition"
                          placeholder={`الصفة ${index + 1}`}
                        />
                        <button onClick={() => removeAttribute(index)} className="text-slate-300 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Birth & Blood */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">تاريخ الميلاد</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">الزمرة الدموية</label>
                    <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50">
                      <option value="">اختر</option>
                      {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 mr-1">مكان الميلاد</label>
                  <input name="birthPlace" value={formData.birthPlace} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50" placeholder="الجزائر العاصمة" />
                </div>

                {/* Wilaya & ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">اللجنة الولائية</label>
                    <select name="wilaya" value={formData.wilaya} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50">
                      <option value="">اختر الولاية</option>
                      {WILAYAS.map(w => <option key={w.id} value={w.id}>{w.id} - {w.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 mr-1">رقم المتطوع</label>
                    <input name="volunteerId" value={formData.volunteerId} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition font-fr bg-slate-50/50" dir="ltr" placeholder="123456" />
                  </div>
                </div>

                {/* Photo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 mr-1">الصورة الشخصية</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition group">
                    <div className="flex flex-col items-center justify-center">
                      {formData.photoUrl ? (
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                          <CheckCircle className="w-4 h-4" /> تم الرفع
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-red-500 transition">
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-bold">اضغط للرفع</span>
                        </div>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>

                {/* Card Size Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 mr-1">حجم البطاقة</label>
                  <select 
                    value={selectedSize.id} 
                    onChange={(e) => setSelectedSize(Object.values(CARD_SIZES).find(s => s.id === e.target.value) || CARD_SIZES.standard)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50/50"
                  >
                    {Object.values(CARD_SIZES).map(size => (
                      <option key={size.id} value={size.id}>{size.name} ({size.width} × {size.height})</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleGenerate}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-xl shadow-red-200 active:scale-[0.98]"
                >
                  <LayoutTemplate className="w-5 h-5" />
                  توليد البطاقة
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                <Table className="text-red-600 w-5 h-5" />
                <h2 className="text-base font-bold text-slate-800">استيراد من Google Sheets</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-blue-700 font-bold leading-relaxed">
                      قم بوضع رابط الجدول الخاص بك هنا. تأكد من أن الجدول متاح للجميع.
                    </p>
                    <button 
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition font-bold"
                    >
                      {showInstructions ? 'إخفاء التعليمات' : 'عرض التعليمات'}
                    </button>
                  </div>
                  
                  {showInstructions && (
                    <div className="mt-3 space-y-3 text-[10px] text-blue-800 border-t border-blue-200 pt-3 animate-in">
                      <p className="font-black underline">أسماء الأعمدة المطلوبة (أو ما يشابهها):</p>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
                        <li>الاسم (عربي)</li>
                        <li>اللقب (عربي)</li>
                        <li>الاسم (فرنسي)</li>
                        <li>اللقب (فرنسي)</li>
                        <li>الصفة</li>
                        <li>الخلية</li>
                        <li>تاريخ الميلاد</li>
                        <li>مكان الميلاد</li>
                        <li>الزمرة الدموية</li>
                        <li>اللجنة الولائية</li>
                        <li>رقم المتطوع</li>
                        <li>الصورة الشخصية</li>
                      </ul>
                      <div className="bg-white/50 p-2 rounded-lg border border-blue-200 mt-2">
                        <p className="font-bold mb-1">ملاحظات هامة:</p>
                        <ul className="space-y-1">
                          <li>• <span className="font-black">اللجنة الولائية:</span> يمكن كتابة اسم الولاية (مثلاً: وهران) أو رقمها (مثلاً: 31).</li>
                          <li>• <span className="font-black">الصورة الشخصية:</span> ضع رابطاً مباشراً للصورة (ينتهي بـ .jpg أو .png) أو رابطاً من Google Drive (تأكد من أنه متاح للجميع).</li>
                          <li>• <span className="font-black">النشر:</span> يفضل استخدام رابط "النشر على الويب" بصيغة CSV لضمان أسرع استجابة.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 mr-1">رابط الجدول</label>
                  <input 
                    value={sheetUrl} 
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 outline-none transition text-sm font-fr" 
                    dir="ltr"
                    placeholder="https://docs.google.com/spreadsheets/d/..." 
                  />
                </div>
                <button 
                  onClick={fetchGoogleSheet}
                  disabled={isLoadingSheet}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isLoadingSheet ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                  جلب البيانات وتوليد البطاقات
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2 animate-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {isGenerated ? (
            <div className="w-full space-y-8">
              <div className="flex items-center justify-between no-print w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400">طريقة العرض</span>
                    <span className="text-sm font-black text-slate-800">
                      {viewMode === 'single' ? 'معاينة فردية' : `معاينة جماعية (${bulkData.length} بطاقة)`}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400">المقاس المعتمد</span>
                    <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                      {selectedSize.width} × {selectedSize.height}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {viewMode === 'single' && (
                    <>
                      <button onClick={() => exportAsImage('png', 'front')} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition" title="تصدير الوجه PNG">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => exportAsImage('png', 'both')} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition" title="تصدير الوجهين PNG">
                        <LayoutTemplate className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button onClick={handlePrint} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-lg shadow-red-100">
                    <Printer className="w-5 h-5" />
                    طباعة الكل
                  </button>
                </div>
              </div>

              <div id="print-area" className="flex flex-col items-center gap-10">
                {viewMode === 'single' ? (
                  <Card data={formData} size={selectedSize} />
                ) : (
                  bulkData.map((data, idx) => (
                    <div key={idx}>
                      <Card data={data} size={selectedSize} isBulk />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-[600px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 bg-white/50">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <CreditCard className="w-16 h-16 opacity-20" />
              </div>
              <p className="text-lg font-black opacity-40">بانتظار توليد البطاقة...</p>
              <p className="text-xs font-bold opacity-30 mt-2">املأ البيانات في الجانب الأيمن للمتابعة</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
