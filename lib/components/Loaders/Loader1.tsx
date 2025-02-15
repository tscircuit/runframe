export default function Loader1() {
  return (
    <>
      <div className="rf-fixed inset-0 rf-flex rf-items-center rf-justify-center">
        <div className="rf-w-64 rf-h-1 rf-bg-gray-200 rf-rounded rf-overflow-hidden rf-relative">
          <div
            className="rf-h-full rf-bg-blue-500 rf-rounded rf-w-1/3"
            style={{ animation: "marquee 2s infinite ease-in-out" }}
          />
        </div>
      </div>

      <style>
        {`
                @keyframes marquee {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }

        `}
      </style>
    </>
  )
}
