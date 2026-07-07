const SAJU_JARGON_RE =
  /일간|일지|월간|월지|년주|월주|연주|시주|지지|천간|십신|십성|오행|상생|상극|육합|삼합|방합|원진|귀문|공망|형벌|순환형|신강|신약|용신|기신|정재|편재|정관|편관|식신|상관|정인|편인|비견|겁재|효신|조후|역마|목\(木\)|화\(火\)|토\(土\)|금\(金\)|수\(水\)/g;

export function sanitizeFriendText(text: string): string {
  return text.replace(SAJU_JARGON_RE, "").replace(/\s{2,}/g, " ").trim();
}
