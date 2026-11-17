import csv,re,json
mine=re.compile(r"instagram.com/(royalsmile_dentalclinic|wowastheticclinic|bioclinic.ae|blonde_medaesthetics_uae|freshnfabsalon|ladiesfirstsalondubai|themostdubai|nuatoi_salon|ken_beauty_ad)/")
rows=[r for r in csv.DictReader(open("/home/user/Clinic/research/A7.csv",encoding="utf-8")) if mine.search(r["instagram"])]
json.dump(rows,open("mine.json","w"),ensure_ascii=False)
print(len(rows))
