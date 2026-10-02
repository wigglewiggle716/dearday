insert into public.listing_availability_windows(listing_id,weekday,start_time,end_time,is_active,capacity_override)
select l.id,d.weekday,'00:00'::time,'23:59'::time,true,null
from public.listings l
join public.listing_versions lv on lv.id=l.published_version_id and coalesce((lv.metadata->>'is_demo')::boolean,false)=true
cross join (values (0::smallint),(1::smallint),(2::smallint),(3::smallint),(4::smallint),(5::smallint),(6::smallint)) d(weekday)
where not exists(
  select 1 from public.listing_availability_windows w where w.listing_id=l.id and w.weekday=d.weekday
);
