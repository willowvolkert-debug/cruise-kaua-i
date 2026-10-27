import React from "react";
import BackButton from "@/components/BackButton";

const JOBS_EMAIL = "cruisekauai@gmail.com";

export default function CommunityJobs() {
  return (
    <div className="p-4 md:p-8 bg-white overflow-x-hidden min-h-screen">
      <div className="max-w-2xl mx-auto">
        <BackButton className="mb-3" />
        <h1 className="cruise-head tracking-widest text-4xl text-secondary leading-none">
          We're hiring! 🌺🚗✨
        </h1>

        <div className="mt-6 py-5 border-y-2 border-gray-200 space-y-3">
          <h2 className="cruise-head tracking-widest text-2xl text-secondary">Creative Intern</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Like what we're doing and want to be a part of it? Email us what you're interested in helping with and your resume, and we will connect if we have a spot for you!
          </p>
          <a
            href={`mailto:${JOBS_EMAIL}`}
            className="block w-full h-16 leading-[4rem] text-center text-xl font-bold rounded-lg bg-primary hover:bg-primary/90 text-white select-none"
          >
            email us
          </a>
        </div>
      </div>
    </div>
  );
}