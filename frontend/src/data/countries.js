const codes =
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' ',
  )
const names = new Intl.DisplayNames(['en'], { type: 'region' })
export const countries = codes
  .map((code) => ({ code, name: names.of(code) }))
  .sort((a, b) => a.name.localeCompare(b.name))
export const callingCodes = {
  LK: '+94',
  IN: '+91',
  GB: '+44',
  US: '+1',
  CA: '+1',
  AU: '+61',
  NZ: '+64',
  DE: '+49',
  FR: '+33',
  IT: '+39',
  ES: '+34',
  NL: '+31',
  CH: '+41',
  SE: '+46',
  NO: '+47',
  DK: '+45',
  IE: '+353',
  RU: '+7',
  CN: '+86',
  JP: '+81',
  KR: '+82',
  SG: '+65',
  MY: '+60',
  TH: '+66',
  ID: '+62',
  AE: '+971',
  SA: '+966',
  QA: '+974',
  MV: '+960',
  PK: '+92',
  BD: '+880',
  NP: '+977',
  ZA: '+27',
  BR: '+55',
  PT: '+351',
  BE: '+32',
  AT: '+43',
  FI: '+358',
  PL: '+48',
}
