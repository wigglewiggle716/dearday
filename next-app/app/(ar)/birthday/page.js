import "../../home.css";
import "../../birthday.css";
import BirthdayPlanning from "../../../components/birthday-planning";

export const metadata={title:"رتّب مناسبتك | Dear Day",robots:{index:false,follow:false}};

export default async function BirthdayPage({searchParams}) {
  const input=await searchParams;
  const value={};
  for(const key of ["occasion","area","budget","date","flow","dd"]){
    if(typeof input?.[key]==="string")value[key]=input[key];
  }
  return <BirthdayPlanning locale="ar" incoming={value}/>;
}
