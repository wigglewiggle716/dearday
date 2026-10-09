import Link from "next/link";
import { pathFor } from "../lib/locales";

// Approved production wording preserved during the React migration (2026-10-09).
export default function RefundsPage({ locale }) {
  return locale === "en" ? (
<main id="main-content" className="dd-main dd-legal-page" dir="ltr">
<section className="legal-hero"><div className="wrap"><span className="eyebrow">Bookings & Orders</span><h1>Cancellation & Refund Policy</h1><p>This policy explains Dear Day’s general cancellation and refund framework and how approved partner, product, and service policies apply to individual items within an order.</p><span className="updated">Last updated: October 2, 2026</span></div></section>

<div className="wrap legal-layout">
<aside className="toc" aria-label="Cancellation and Refund Policy contents"><strong>On this page</strong><a href="#scope">Scope</a><a href="#specific">Policy applied to each item</a><a href="#cancel">Cancellation requests</a><a href="#custom">Custom products & services</a><a href="#partner">Partner cancellation</a><a href="#refund">Refund processing</a><a href="#fees">Fees & actual costs</a><a href="#issues">Order issues & disputes</a><a href="#rights">Legal rights</a><a href="#contact">Contact us</a></aside>
<article className="legal-card">
<div className="intro-note">There is no single cancellation window or refund percentage that applies to every Dear Day service. The applicable terms may differ from one item to another within the same order. Where an approved item-specific policy applies, the material terms are shown before booking confirmation.</div>

<section className="legal-section" id="scope"><h2>1. Scope</h2><p>This policy applies to orders and bookings made through Dear Day, including gifts, cakes and sweets, venues and experiences, occasion-planning services, and other products or services available on the platform.</p><p>Dear Day sets the general framework within which cancellation and refund policies operate. A partner may propose a general policy for its services or a specific exception for a particular product or service, provided that it is submitted through Dear Day’s approved process and reviewed before it becomes effective.</p></section>


<section className="legal-section" id="specific"><h2>2. Policy Applied to Each Item</h2><p>The effective policy is determined in the following order: an approved product or service-specific policy, if one exists; then the approved partner policy; then Dear Day’s general policy where no more specific policy applies. If the general policy does not define an automatic refund percentage for a particular case, the cancellation request is reviewed manually.</p><p>A single order may contain multiple items from multiple partners, so each item may have a different cancellation window and refund percentage. Cancellation and refund eligibility is therefore assessed at the item level, or for the affected part of the order, and not necessarily against the total order as a whole.</p><div className="important"><strong>Reference version:</strong> When an order is confirmed, Dear Day retains a snapshot of the policy that applies to each item. That snapshot remains the reference for the item even if Dear Day or the partner later changes the policy. Later changes do not apply retroactively to previously confirmed orders, subject to any mandatory legal rights.</div></section>


<section className="legal-section" id="cancel"><h2>3. Customer Cancellation Requests</h2><p>A customer may request cancellation of an order or an individual item through the support options available in Dear Day. Where the applicable policy uses time-based tiers, the refund percentage is calculated according to the time remaining before the occasion or the stage of fulfilment, as shown for that item.</p><p>Before a refund is completed, Dear Day shows the outcome of the request and the expected or approved refund amount for each affected item. Cases that are not covered by a clear automatic rule may require manual review.</p></section>


<section className="legal-section" id="custom"><h2>4. Custom Products & Services</h2><p>Some products and services are prepared specifically for the customer, such as custom cakes, engraved or printed gifts, and decoration or arrangements designed for a particular occasion. These orders may become wholly or partially non-cancellable or non-refundable after preparation begins or the service provider incurs related costs, where this is stated in the policy shown and applied to the item and where permitted by law.</p></section>


<section className="legal-section" id="partner"><h2>5. Cancellation or Failure to Fulfil by a Service Provider</h2><p>If a service provider is unable to fulfil a confirmed item, Dear Day will contact the customer regarding the affected part. The default approach is to refund the amount paid for the part that will not be fulfilled unless the customer agrees to a suitable alternative or another arrangement, subject to the circumstances and any rights or obligations imposed by applicable law.</p></section>


<section className="legal-section" id="refund"><h2>6. Refund Processing</h2><p>Where a customer is entitled to a refund, it will be processed using the appropriate method based on the original payment method and the payment provider’s procedures. Additional time may be required before the refund appears in the customer’s account due to the bank’s or payment provider’s processing time, which may be outside Dear Day’s direct control.</p><p>Until direct payment-provider integration is enabled for every refund case, the refund status inside Dear Day may remain pending or processing until the financial transaction is confirmed as completed.</p></section>


<section className="legal-section" id="fees"><h2>7. Fees & Actual Costs</h2><p>A refund amount may be affected by costs already incurred for a custom order, reserved resource, or venue only where that treatment is consistent with the policy applicable to the item, has been appropriately disclosed to the customer, and complies with applicable law. Dear Day will not impose undisclosed deductions or fees contrary to the agreed terms.</p></section>


<section className="legal-section" id="issues"><h2>8. Order Issues & Disputes</h2><p>If a refund request arises because of a problem with a product or service, non-fulfilment, or a material difference from the description, the customer may contact Dear Day Support. These cases may be reviewed separately from ordinary voluntary-cancellation rules and will be assessed based on the facts of the case and the relevant legal rights.</p></section>


<section className="legal-section" id="rights"><h2>9. Consumer Legal Rights</h2><p>This policy is not intended to exclude or reduce any mandatory consumer right under the laws and regulations applicable in the Arab Republic of Egypt. If a contractual term conflicts with a legal right that cannot lawfully be waived, applicable law will prevail.</p></section>


<section className="legal-section" id="contact"><h2>10. Contact Us About a Cancellation or Refund</h2><p>To request a cancellation or refund, or to ask about the status of an existing request, please contact Dear Day through our <Link href={pathFor("contact", locale)}>Contact Us</Link> page and include the relevant order details so we can review your request.</p></section>

</article></div>
</main>
  ) : (
<main id="main-content" className="dd-main dd-legal-page" dir="rtl">
<section className="legal-hero"><div className="wrap"><span className="eyebrow">الحجوزات والطلبات</span><h1>سياسة الإلغاء والاسترداد</h1><p>توضح هذه السياسة الإطار العام للإلغاء والاسترداد في Dear Day، وكيف تطبق السياسات المعتمدة الخاصة بالشركاء والمنتجات والخدمات على عناصر الطلب المختلفة.</p><span className="updated">آخر تحديث: 2 أكتوبر 2026</span></div></section>

<div className="wrap legal-layout">
<aside className="toc" aria-label="محتويات سياسة الإلغاء والاسترداد"><strong>محتويات الصفحة</strong><a href="#scope">نطاق السياسة</a><a href="#specific">السياسة المطبقة على كل عنصر</a><a href="#cancel">طلبات الإلغاء</a><a href="#custom">الطلبات المخصصة</a><a href="#partner">إلغاء مقدم الخدمة</a><a href="#refund">الاسترداد</a><a href="#fees">الرسوم والتكاليف</a><a href="#issues">المشكلات والنزاعات</a><a href="#rights">الحقوق القانونية</a><a href="#contact">التواصل معنا</a></aside>
<article className="legal-card">
<div className="intro-note">لا توجد مدة إلغاء أو نسبة استرداد واحدة تنطبق على جميع خدمات Dear Day. قد تختلف السياسة من عنصر إلى آخر داخل الطلب نفسه. وتظهر الشروط الجوهرية المطبقة على المنتج أو الخدمة قبل تأكيد الحجز متى كانت هناك سياسة خاصة معتمدة.</div>

<section className="legal-section" id="scope"><h2>1. نطاق السياسة</h2><p>تنطبق هذه السياسة على الطلبات والحجوزات التي تتم من خلال Dear Day، بما في ذلك الهدايا وشكولاته و كيك والأماكن والتجارب وخدمات تنظيم المناسبات وغيرها من الخدمات المتاحة على المنصة.</p><p>تضع Dear Day الإطار العام الذي تعمل داخله سياسات الإلغاء والاسترداد. ويمكن للشريك اقتراح سياسة عامة لخدماته أو استثناء خاص بمنتج أو خدمة معينة، على أن يتم ذلك من خلال النظام المعتمد في Dear Day وأن يخضع للمراجعة قبل أن يصبح نافذًا.</p></section>


<section className="legal-section" id="specific"><h2>2. السياسة المطبقة على كل عنصر</h2><p>تحدد السياسة الفعالة وفق الترتيب التالي: سياسة خاصة معتمدة للمنتج أو الخدمة إن وجدت، ثم سياسة الشريك المعتمدة، ثم سياسة Dear Day العامة عند عدم وجود سياسة خاصة. إذا لم تحدد السياسة العامة نسبة آلية لحالة معينة، تتم مراجعة طلب الإلغاء يدويًا.</p><p>قد يحتوي الطلب الواحد على أكثر من عنصر من أكثر من شريك، ولذلك قد تكون لكل عنصر مهلة إلغاء ونسبة استرداد مختلفة. ويتم تقييم الإلغاء والاسترداد على مستوى العنصر أو الجزء المتأثر من الطلب، وليس بالضرورة على إجمالي الطلب كله.</p><div className="important"><strong>النسخة المرجعية:</strong> عند تأكيد الطلب، تحتفظ Dear Day بنسخة من السياسة المطبقة على كل عنصر. وتظل هذه النسخة هي المرجع لذلك العنصر حتى إذا غيّر الشريك أو Dear Day السياسة لاحقًا. لا تطبق التغييرات اللاحقة بأثر رجعي على الطلبات المؤكدة سابقًا، مع مراعاة الحقوق القانونية الإلزامية.</div></section>


<section className="legal-section" id="cancel"><h2>3. طلب الإلغاء من العميل</h2><p>يمكن للعميل طلب إلغاء الطلب أو عنصر منه من خلال وسائل الدعم المتاحة في Dear Day. عندما توجد سياسة متدرجة حسب الوقت، تحسب نسبة الاسترداد وفق المدة المتبقية قبل الموعد أو مرحلة التنفيذ بحسب ما هو معروض لذلك العنصر.</p><p>قبل تنفيذ الاسترداد، تعرض Dear Day نتيجة الطلب والمبلغ المتوقع أو المعتمد للاسترداد لكل عنصر متأثر. وقد تحتاج الحالات التي لا تغطيها قاعدة آلية واضحة إلى مراجعة يدوية.</p></section>


<section className="legal-section" id="custom"><h2>4. المنتجات والخدمات المخصصة</h2><p>بعض المنتجات والخدمات يتم تجهيزها خصيصًا للعميل، مثل الكيك المخصص، والهدايا المحفورة أو المطبوعة، والديكور أو الترتيبات المصممة لمناسبة محددة. قد تصبح هذه الطلبات غير قابلة للإلغاء أو الاسترداد كليًا أو جزئيًا بعد بدء التجهيز أو تحمل مقدم الخدمة تكاليف مرتبطة بها، إذا كان ذلك منصوصًا عليه في السياسة المعروضة والمطبقة على العنصر وبما لا يخالف القانون.</p></section>


<section className="legal-section" id="partner"><h2>5. إلغاء أو تعذر التنفيذ من مقدم الخدمة</h2><p>إذا تعذر على مقدم الخدمة تنفيذ عنصر مؤكد، ستتواصل Dear Day مع العميل بشأن الجزء المتأثر. ويكون الأصل رد القيمة المدفوعة عن الجزء الذي لن يتم تنفيذه، ما لم يوافق العميل على بديل مناسب أو ترتيب آخر، وذلك مع مراعاة طبيعة الحالة وأي حقوق أو التزامات يقررها القانون.</p></section>


<section className="legal-section" id="refund"><h2>6. طريقة الاسترداد</h2><p>عندما يكون للعميل مبلغ مستحق للاسترداد، تتم معالجة الاسترداد بالطريقة المناسبة وفق وسيلة الدفع المستخدمة وإجراءات مزود الدفع. قد تحتاج المعاملة إلى وقت إضافي حتى تظهر في حساب العميل وفق إجراءات البنك أو مزود خدمة الدفع، وهو أمر قد يكون خارج السيطرة المباشرة لـ Dear Day.</p><p>حتى يتم تفعيل الربط المباشر مع مزود الدفع في جميع حالات الاسترداد، قد تظهر حالة طلب الاسترداد داخل Dear Day كمعلق أو قيد المعالجة إلى أن يتم تأكيد تنفيذ العملية ماليًا.</p></section>


<section className="legal-section" id="fees"><h2>7. الرسوم والتكاليف الفعلية</h2><p>قد تتأثر قيمة الاسترداد بتكاليف تم تحملها بالفعل لتنفيذ طلب مخصص أو حجز مورد أو مكان فقط عندما تكون هذه المعاملة متوافقة مع السياسة المطبقة على العنصر، ومعلنة للعميل على نحو مناسب، ولا تخالف القانون المعمول به. لن يتم فرض خصومات أو رسوم غير معلنة على نحو يخالف ما تم الاتفاق عليه.</p></section>


<section className="legal-section" id="issues"><h2>8. المشكلات والنزاعات المتعلقة بالطلب</h2><p>إذا كان سبب طلب الاسترداد وجود مشكلة في المنتج أو الخدمة، أو عدم التنفيذ، أو اختلاف جوهري عن الوصف، يمكن للعميل التواصل مع دعم Dear Day. قد يتم التعامل مع هذه الحالات كمراجعة مستقلة عن قواعد الإلغاء الاختياري المعتادة، وسيتم تقييمها وفق تفاصيل الواقعة والحقوق القانونية ذات الصلة.</p></section>


<section className="legal-section" id="rights"><h2>9. الحقوق القانونية للمستهلك</h2><p>لا تهدف هذه السياسة إلى استبعاد أو تقليل أي حق إلزامي يتمتع به المستهلك بموجب القوانين واللوائح المعمول بها في جمهورية مصر العربية. وفي حال تعارض أي شرط تعاقدي مع حق قانوني لا يجوز التنازل عنه، تكون الأولوية لأحكام القانون.</p></section>


<section className="legal-section" id="contact"><h2>10. التواصل بخصوص الإلغاء أو الاسترداد</h2><p>لطلب إلغاء أو استرداد أو الاستفسار عن حالة طلب قائم، يرجى التواصل مع Dear Day من خلال صفحة <Link href={pathFor("contact", locale)}>تواصل معنا</Link> مع ذكر بيانات الطلب اللازمة حتى نتمكن من مراجعته.</p></section>

</article></div>
</main>
  );
}
