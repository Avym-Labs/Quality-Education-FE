export const COMPLAINT_CATEGORIES = [
  {
    id: 'behaviour',
    titleEn: '1. Behaviour and classroom conduct',
    titleGu: 'વર્તન અને વર્ગખંડની શિસ્ત',
    phoneticGu: 'VARTAN ANE VARGKHANDNI SHIST',
    items: [
      {
        id: 'disrupting',
        textEn: 'Disrupting classroom activities',
        textGu: 'વર્ગના કાર્યમાં વિક્ષેપ કરે છે',
        phoneticGu: 'VARG NAA KARYA MAA VIKSHEP KARE CHE',
      },
      {
        id: 'talking',
        textEn: 'Talking during class',
        textGu: 'ચાલુ ક્લાસમાં વાતો કરે છે',
        phoneticGu: 'CHAALU CLASS MAA VAATO KARE CHE',
      },
      {
        id: 'discipline_reminder',
        textEn: 'Needs reminder to maintain classroom discipline',
        textGu: 'વર્ગખંડમાં શિસ્ત જાળવવા માટે યાદ કરાવવું પડે છે',
        phoneticGu: 'VARGKHANDMAA SHIST JAADAVVA MAATE YAAD KARAVVU PADE CHE',
      },
      {
        id: 'focus_support',
        textEn: 'Needs support in staying focused during lessons',
        textGu: 'એકાગ્રતા વધે તેવા પ્રયત્ન કરશો',
        phoneticGu: 'EKAGRATA VADHE TEVA PRAYATNA KARSHO',
      },
      {
        id: 'accountability',
        textEn: 'Accountability is expected',
        textGu: 'જવાબદાર બને તે અત્યંત જરૂરી',
        phoneticGu: 'JAVABDAAR BANE TE ATYANT JARURI',
      },
    ],
  },
  {
    id: 'uniform',
    titleEn: '2. Uniform and dress code',
    titleGu: 'ગણવેશ અને પોશાકના નિયમો',
    phoneticGu: 'GANVESH ANE POSHAAKNA NIYAMO',
    items: [
      {
        id: 'proper_dress',
        textEn: 'Requesting a proper dress code',
        textGu: 'ક્લાસને અનુરૂપ ગણવેશ પહેરવા વિનંતી',
        phoneticGu: 'Class ne anurup ganvesh peherva vinanti',
      },
      {
        id: 'personal_neatness',
        textEn: 'Needs attention to personal neatness',
        textGu: 'વ્યક્તિગત સ્વચ્છતા જાળવવા વિનંતી',
        phoneticGu: 'vyaktigat sudhadta jaadavva vinanti',
      },
    ],
  },
  {
    id: 'homework',
    titleEn: '3. Homework',
    titleGu: 'ગૃહકાર્ય / હોમવર્ક',
    phoneticGu: 'GRUHKARYA / HOMEWORK',
    items: [
      {
        id: 'hw_not_completed',
        textEn: 'Homework not completed',
        textGu: 'ગૃહકાર્ય પૂરું કર્યું નથી',
        phoneticGu: 'gruhkaarya puru karyu nathi',
      },
      {
        id: 'hw_not_submitted',
        textEn: 'Homework not submitted',
        textGu: 'ગૃહકાર્ય રજૂ કર્યું નથી',
        phoneticGu: 'gruhkaarya raju karyu nathi',
      },
      {
        id: 'hw_corrections',
        textEn: 'Homework corrections pending',
        textGu: 'ગૃહકાર્યમાં જરૂરી સુધારા કરાવવાના બાકી છે',
        phoneticGu: 'gruhkaaryamaa jaruri sudhaara karaavvaana baaki che',
      },
    ],
  },
  {
    id: 'classwork',
    titleEn: '4. Classwork',
    titleGu: 'વર્ગકાર્ય',
    phoneticGu: 'VARGKARYA',
    items: [
      {
        id: 'cw_incomplete',
        textEn: 'Classwork incomplete',
        textGu: 'વર્ગકાર્ય અધૂરું છે',
        phoneticGu: 'vargkaarya adhuru che',
      },
      {
        id: 'cw_handwriting',
        textEn: 'Needs improvement in handwriting',
        textGu: 'અક્ષરમાં સુધારાની જરૂર છે',
        phoneticGu: 'akshar maa sudhaara ni jarur che',
      },
      {
        id: 'cw_no_notebook',
        textEn: 'Not carrying classwork notebook',
        textGu: 'વર્ગકાર્યની ચોપડી લાવતા નથી',
        phoneticGu: 'vargkaarya ni chopdi laavta nathi',
      },
    ],
  },
  {
    id: 'academic',
    titleEn: '5. Academic progress',
    titleGu: 'શૈક્ષણિક પ્રગતિ',
    phoneticGu: 'SAIKSHANIK PRAGATI',
    items: [
      {
        id: 'acad_practice',
        textEn: 'Needs additional practice',
        textGu: 'વધુ પ્રેક્ટિસની જરૂર છે',
        phoneticGu: 'vadhu practiceni jarur che',
      },
      {
        id: 'acad_revision',
        textEn: 'Needs thorough revision of previous topics/classes',
        textGu: 'અગાઉ ભણાવેલા મુદ્દાનું પુનરાવર્તનની જરૂર છે',
        phoneticGu: 'agaavu bhanaavela mudaanu punaraavartan ni jarur che',
      },
      {
        id: 'acad_tests',
        textEn: 'Needs attention on tests and results',
        textGu: 'ટેસ્ટના પરિણામ પર ધ્યાન આપવાની જરૂર',
        phoneticGu: 'testna parinaam par dhyaan aapvaani jarur',
      },
    ],
  },
  {
    id: 'attendance',
    titleEn: '6. Attendance',
    titleGu: 'હાજરી',
    phoneticGu: 'HAAJRI',
    items: [
      {
        id: 'att_late',
        textEn: 'Late arrival',
        textGu: 'મોડા આવે છે',
        phoneticGu: 'modaa aave che',
      },
      {
        id: 'att_absent',
        textEn: 'Frequent absence',
        textGu: 'વારંવાર ગેરહાજર રહેવું',
        phoneticGu: 'vaaramvaar ger haajar rehvu',
      },
      {
        id: 'att_irregular',
        textEn: 'Irregular',
        textGu: 'અનિયમિત',
        phoneticGu: 'aniyamit',
      },
    ],
  },
]

export const CUSTOM_COMPLAINT_TITLE_EN = '7. Custom'
export const CUSTOM_COMPLAINT_TITLE_GU = '૭. અન્ય નોંધ / ફરિયાદ'

export function formatComplaintLine(rawLine, isGu = false) {
  if (!rawLine) return ''
  for (const cat of COMPLAINT_CATEGORIES) {
    for (const it of cat.items) {
      const fullKey = `${it.textEn} (${it.textGu})`
      if (rawLine === fullKey || rawLine === it.textEn || rawLine === it.textGu) {
        return isGu ? it.textGu : it.textEn
      }
    }
  }
  return rawLine
}
