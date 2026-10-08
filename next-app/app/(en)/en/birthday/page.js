import "../../../home.css";
import "../../../birthday.css";
import BirthdayPlanning from "../../../../components/birthday-planning";

export const metadata={title:"Plan Your Occasion | Dear Day",robots:{index:false,follow:false}};

export default async function EnglishBirthdayPage({searchParams}) {
  const input=await searchParams;
  const value={};
  for(const key of ["occasion","area","budget","date","flow","dd"]){
    if(typeof input?.[key]==="string")value[key]=input[key];
  }
  return <BirthdayPlanning locale="en" incoming={value}/>;
}
