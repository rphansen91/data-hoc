function cleanStr(name: string = ''): string {
  return name.toString().replace(/\n/g, '')
}

export default function tokenize(name: string, params: any): string {
  return `${cleanStr(name)}(${JSON.stringify(params)})`
}
